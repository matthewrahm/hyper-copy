import math
import time
from collections import defaultdict

from hyper_copy.client import HyperliquidTraderClient
from hyper_copy.models import Fill, Trade, TraderScore


class TraderScorer:
    """Scores traders based on their fill history."""

    def __init__(self, client: HyperliquidTraderClient):
        self.client = client

    def score(self, address: str, days_back: int = 90) -> TraderScore:
        """Compute comprehensive score for a trader."""
        fills = self.client.get_all_fills(address, max_fills=10000, days_back=days_back)
        account_value = self.client.get_account_value(address)

        trades = self._group_into_trades(fills)
        now = time.time()

        if not trades:
            return TraderScore(
                address=address,
                total_pnl=0, roi=0, win_rate=0, total_trades=0,
                avg_pnl_per_trade=0, max_drawdown=0, sharpe_ratio=0,
                avg_hold_time_hours=0, trade_frequency_per_day=0,
                active_since=0, account_value=account_value,
                score=0, scored_at=now,
            )

        total_pnl = sum(t.net_pnl for t in trades)
        winning = [t for t in trades if t.net_pnl > 0]
        win_rate = len(winning) / len(trades) if trades else 0
        avg_pnl = total_pnl / len(trades) if trades else 0

        # ROI: total PnL relative to max capital deployed
        max_capital = max(t.size * t.entry_price for t in trades) if trades else 1
        roi = total_pnl / max_capital if max_capital > 0 else 0

        # Max drawdown from cumulative PnL curve
        max_drawdown = self._compute_drawdown(trades)

        # Sharpe ratio (daily returns basis)
        sharpe = self._compute_sharpe(trades)

        # Hold time
        hold_times = [t.hold_time_hours for t in trades if t.hold_time_hours > 0]
        avg_hold = sum(hold_times) / len(hold_times) if hold_times else 0

        # Trade frequency
        first_time = min(t.open_time for t in trades)
        last_time = max(t.close_time for t in trades)
        span_days = max((last_time - first_time) / (1000 * 86400), 1)
        freq = len(trades) / span_days

        # Composite score (0-100)
        composite = self._compute_composite(
            roi=roi,
            win_rate=win_rate,
            sharpe=sharpe,
            max_drawdown=max_drawdown,
            trade_count=len(trades),
            active_days=span_days,
        )

        return TraderScore(
            address=address,
            total_pnl=total_pnl,
            roi=roi,
            win_rate=win_rate,
            total_trades=len(trades),
            avg_pnl_per_trade=avg_pnl,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe,
            avg_hold_time_hours=avg_hold,
            trade_frequency_per_day=freq,
            active_since=first_time,
            account_value=account_value,
            score=composite,
            scored_at=now,
        )

    def _group_into_trades(self, fills: list[Fill]) -> list[Trade]:
        """Group fills into round-trip trades by coin.

        A trade opens when position goes from 0 to non-zero,
        and closes when it returns to 0.
        """
        # Sort by time
        fills = sorted(fills, key=lambda f: f.time)

        # Track per-coin position state
        positions: dict[str, dict] = defaultdict(lambda: {
            "net_size": 0.0,
            "fills": [],
            "entry_prices": [],
            "entry_sizes": [],
        })

        trades = []

        for fill in fills:
            coin = fill.coin
            pos = positions[coin]
            signed_size = fill.size if fill.side == "B" else -fill.size

            prev_net = pos["net_size"]
            pos["net_size"] += signed_size
            pos["fills"].append(fill)

            # Position opened (was 0, now non-zero)
            if prev_net == 0 and pos["net_size"] != 0:
                pos["entry_prices"] = [fill.price]
                pos["entry_sizes"] = [fill.size]
                pos["open_time"] = fill.time

            # Position added to (same direction)
            elif prev_net != 0 and (prev_net > 0) == (pos["net_size"] > 0) and abs(pos["net_size"]) > abs(prev_net):
                pos["entry_prices"].append(fill.price)
                pos["entry_sizes"].append(fill.size)

            # Position closed (crossed zero or hit zero)
            if (prev_net > 0 and pos["net_size"] <= 0) or (prev_net < 0 and pos["net_size"] >= 0):
                # Compute weighted average entry
                total_entry_size = sum(pos["entry_sizes"])
                if total_entry_size > 0:
                    avg_entry = sum(p * s for p, s in zip(pos["entry_prices"], pos["entry_sizes"])) / total_entry_size
                else:
                    avg_entry = fill.price

                side = "LONG" if prev_net > 0 else "SHORT"
                trade_size = abs(prev_net)
                open_time = pos.get("open_time", fill.time)

                # PnL from closed_pnl field in fills
                trade_pnl = sum(f.closed_pnl for f in pos["fills"])
                trade_fees = sum(f.fee for f in pos["fills"])

                hold_hours = (fill.time - open_time) / (1000 * 3600)

                trades.append(Trade(
                    coin=coin,
                    side=side,
                    entry_price=avg_entry,
                    exit_price=fill.price,
                    size=trade_size,
                    pnl=trade_pnl,
                    fees=trade_fees,
                    net_pnl=trade_pnl - trade_fees,
                    open_time=open_time,
                    close_time=fill.time,
                    hold_time_hours=max(hold_hours, 0),
                ))

                # Reset position state
                pos["fills"] = []
                pos["entry_prices"] = []
                pos["entry_sizes"] = []

                # If overshot (reversed), start new position
                if pos["net_size"] != 0:
                    pos["entry_prices"] = [fill.price]
                    pos["entry_sizes"] = [abs(pos["net_size"])]
                    pos["open_time"] = fill.time

        return trades

    def _compute_drawdown(self, trades: list[Trade]) -> float:
        """Max drawdown from cumulative PnL curve."""
        if not trades:
            return 0

        cumulative = 0
        peak = 0
        max_dd = 0

        for t in sorted(trades, key=lambda t: t.close_time):
            cumulative += t.net_pnl
            if cumulative > peak:
                peak = cumulative
            dd = (peak - cumulative) / max(peak, 1) if peak > 0 else 0
            max_dd = max(max_dd, dd)

        return max_dd

    def _compute_sharpe(self, trades: list[Trade]) -> float:
        """Simplified Sharpe ratio from per-trade returns."""
        if len(trades) < 2:
            return 0

        returns = [t.net_pnl for t in trades]
        avg = sum(returns) / len(returns)
        variance = sum((r - avg) ** 2 for r in returns) / len(returns)
        std = math.sqrt(variance) if variance > 0 else 1

        # Annualize: assume daily trading
        return (avg / std) * math.sqrt(365) if std > 0 else 0

    def _compute_composite(
        self,
        roi: float,
        win_rate: float,
        sharpe: float,
        max_drawdown: float,
        trade_count: int,
        active_days: float,
    ) -> float:
        """Composite score 0-100."""
        # Normalize each metric to 0-1 range with reasonable bounds
        roi_score = min(max(roi, 0), 5) / 5  # Cap at 500% ROI
        wr_score = win_rate  # Already 0-1
        sharpe_score = min(max(sharpe, 0), 5) / 5  # Cap at 5.0 Sharpe
        dd_score = 1 - min(max_drawdown, 1)  # Lower drawdown = better
        trade_score = min(trade_count / 100, 1)  # Cap at 100 trades
        longevity_score = min(active_days / 180, 1)  # Cap at 6 months

        # Weighted composite
        composite = (
            roi_score * 0.25
            + wr_score * 0.20
            + sharpe_score * 0.20
            + dd_score * 0.15
            + trade_score * 0.10
            + longevity_score * 0.10
        )

        return round(composite * 100, 1)
