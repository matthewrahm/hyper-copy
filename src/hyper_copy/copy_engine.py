import logging
import time

from hyper_copy.client import HyperliquidTraderClient
from hyper_copy.db import Database
from hyper_copy.risk import RiskManager
from hyper_copy.models import CopyConfig, CopyOrder, PositionChange, TraderPosition

logger = logging.getLogger(__name__)


class CopyEngine:
    """Monitors leader positions and generates copy orders."""

    def __init__(self, client: HyperliquidTraderClient, db: Database):
        self.client = client
        self.db = db
        self.risk = RiskManager()
        # In-memory cache of last known leader positions: {address: {coin: TraderPosition}}
        self._last_positions: dict[str, dict[str, TraderPosition]] = {}

    def detect_changes(self, leader_address: str) -> list[PositionChange]:
        """Compare current positions to last known state."""
        snapshot = self.client.get_snapshot(leader_address)
        current = {p.coin: p for p in snapshot.positions}
        previous = self._last_positions.get(leader_address, {})

        changes = []

        # Check for new or modified positions
        for coin, pos in current.items():
            prev = previous.get(coin)
            if prev is None:
                changes.append(PositionChange(
                    coin=coin, change_type="open",
                    prev_size=0, new_size=pos.size,
                    prev_side="", new_side=pos.side,
                    mark_price=pos.mark_price,
                ))
            elif pos.size != prev.size or pos.side != prev.side:
                if pos.size > prev.size:
                    change_type = "increase"
                else:
                    change_type = "decrease"
                changes.append(PositionChange(
                    coin=coin, change_type=change_type,
                    prev_size=prev.size, new_size=pos.size,
                    prev_side=prev.side, new_side=pos.side,
                    mark_price=pos.mark_price,
                ))

        # Check for closed positions
        for coin, prev in previous.items():
            if coin not in current:
                changes.append(PositionChange(
                    coin=coin, change_type="close",
                    prev_size=prev.size, new_size=0,
                    prev_side=prev.side, new_side="",
                    mark_price=prev.mark_price,
                ))

        # Update cached state
        self._last_positions[leader_address] = current
        return changes

    def generate_orders(
        self,
        changes: list[PositionChange],
        config: CopyConfig,
        leader_account_value: float,
        copier_account_value: float,
    ) -> list[CopyOrder]:
        """Generate proportional copy orders from position changes."""
        if leader_account_value <= 0 or copier_account_value <= 0:
            return []

        scale = copier_account_value / leader_account_value
        orders = []

        for change in changes:
            if change.change_type == "open":
                target_size = change.new_size * scale
                side = "B" if change.new_side == "LONG" else "A"
                leader_pct = (change.new_size * change.mark_price) / leader_account_value

                order = CopyOrder(
                    coin=change.coin,
                    side=side,
                    size=round(target_size, 4),
                    price=change.mark_price,
                    reason="open",
                    leader_position_pct=leader_pct,
                    copier_target_size=target_size,
                )

                passed, reason = self.risk.check_position(config, order, copier_account_value)
                if passed:
                    orders.append(order)
                else:
                    logger.info(f"Risk blocked {change.coin} open: {reason}")

            elif change.change_type == "close":
                side = "A" if change.prev_side == "LONG" else "B"
                orders.append(CopyOrder(
                    coin=change.coin,
                    side=side,
                    size=round(change.prev_size * scale, 4),
                    price=change.mark_price,
                    reduce_only=True,
                    reason="close",
                ))

            elif change.change_type == "increase":
                delta = change.new_size - change.prev_size
                target_delta = delta * scale
                side = "B" if change.new_side == "LONG" else "A"

                order = CopyOrder(
                    coin=change.coin,
                    side=side,
                    size=round(target_delta, 4),
                    price=change.mark_price,
                    reason="increase",
                )

                passed, reason = self.risk.check_position(config, order, copier_account_value)
                if passed:
                    orders.append(order)
                else:
                    logger.info(f"Risk blocked {change.coin} increase: {reason}")

            elif change.change_type == "decrease":
                delta = change.prev_size - change.new_size
                target_delta = delta * scale
                side = "A" if change.prev_side == "LONG" else "B"

                orders.append(CopyOrder(
                    coin=change.coin,
                    side=side,
                    size=round(target_delta, 4),
                    price=change.mark_price,
                    reduce_only=True,
                    reason="decrease",
                ))

        return orders

    def log_orders(self, orders: list[CopyOrder], config: CopyConfig, status: str = "paper"):
        """Log copy orders to database."""
        now = time.time()
        for order in orders:
            self.db._conn.execute(
                """INSERT INTO copy_log
                   (timestamp, copier_address, leader_address, coin, side, size, price, order_type, reason, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (now, config.copier_address, config.leader_address,
                 order.coin, order.side, order.size, order.price,
                 order.order_type, order.reason, status),
            )
        self.db._conn.commit()

    def run_paper(self, config: CopyConfig, interval: int = 5, max_iterations: int = 0):
        """Run copy engine in paper mode.

        Polls leader positions every `interval` seconds and logs
        what it would trade. Set max_iterations=0 for unlimited.
        """
        logger.info(f"Paper mode: copying {config.leader_address[:10]}... for {config.copier_address[:10]}...")
        logger.info(f"Polling every {interval}s...")

        iteration = 0
        while max_iterations == 0 or iteration < max_iterations:
            try:
                changes = self.detect_changes(config.leader_address)

                if changes:
                    leader_val = self.client.get_account_value(config.leader_address)
                    copier_val = self.client.get_account_value(config.copier_address)
                    orders = self.generate_orders(changes, config, leader_val, copier_val)

                    for change in changes:
                        logger.info(
                            f"  Change: {change.coin} {change.change_type} "
                            f"{change.prev_size:.4f} -> {change.new_size:.4f} "
                            f"({change.new_side or change.prev_side})"
                        )

                    for order in orders:
                        logger.info(
                            f"  PAPER ORDER: {order.side} {order.size:.4f} {order.coin} "
                            f"@ ${order.price:,.2f} ({order.reason})"
                        )

                    if orders:
                        self.log_orders(orders, config, status="paper")

                iteration += 1
                time.sleep(interval)

            except KeyboardInterrupt:
                logger.info("Paper mode stopped")
                break
            except Exception as e:
                logger.error(f"Copy engine error: {e}")
                time.sleep(interval)
