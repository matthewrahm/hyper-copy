import httpx

from hyper_copy.models import TraderPosition, Fill, TraderSnapshot


API_URL = "https://api.hyperliquid.xyz"


class HyperliquidTraderClient:
    """Client for fetching trader data from Hyperliquid."""

    def __init__(self):
        self._http = httpx.Client(timeout=15)

    def _post(self, payload: dict) -> dict | list:
        resp = self._http.post(f"{API_URL}/info", json=payload)
        resp.raise_for_status()
        return resp.json()

    def get_snapshot(self, address: str) -> TraderSnapshot:
        """Fetch full account snapshot: positions, margin, equity."""
        data = self._post({"type": "clearinghouseState", "user": address})

        positions = []
        for pos in data.get("assetPositions", []):
            p = pos.get("position", {})
            size = float(p.get("szi", "0"))
            if size == 0:
                continue

            entry = float(p.get("entryPx", "0"))
            mark = float(p.get("markPx", entry))
            notional = abs(size) * mark

            positions.append(TraderPosition(
                coin=p.get("coin", ""),
                size=abs(size),
                side="LONG" if size > 0 else "SHORT",
                entry_price=entry,
                mark_price=mark,
                unrealized_pnl=float(p.get("unrealizedPnl", "0")),
                leverage=int(float(p.get("leverage", {}).get("value", "1"))),
                liquidation_price=float(p.get("liquidationPx", "0") or "0"),
                margin_used=float(p.get("marginUsed", "0")),
                position_value=notional,
            ))

        margin = data.get("marginSummary", {})
        return TraderSnapshot(
            address=address,
            account_value=float(margin.get("accountValue", "0")),
            positions=positions,
            total_margin_used=float(margin.get("totalMarginUsed", "0")),
            withdrawable=float(data.get("withdrawable", "0")),
        )

    def get_fills(self, address: str, start_time: int | None = None, limit: int = 2000) -> list[Fill]:
        """Fetch trade fills, paginated by time.

        Returns up to `limit` fills. For more, call again with
        start_time = last fill's time + 1.
        """
        import time as _time
        payload: dict = {"type": "userFillsByTime", "user": address}
        # startTime is required -- default to 30 days ago
        if start_time is None:
            start_time = int((_time.time() - 30 * 86400) * 1000)
        payload["startTime"] = start_time

        raw = self._post(payload)
        fills = []
        for f in raw[:limit]:
            fills.append(Fill(
                coin=f.get("coin", ""),
                side=f.get("side", ""),
                price=float(f.get("px", "0")),
                size=float(f.get("sz", "0")),
                time=f.get("time", 0),
                fee=float(f.get("fee", "0")),
                closed_pnl=float(f.get("closedPnl", "0")),
                oid=f.get("oid", 0),
                direction=f.get("dir", ""),
                crossed=f.get("crossed", False),
            ))
        return fills

    def get_all_fills(self, address: str, max_fills: int = 10000, days_back: int = 90) -> list[Fill]:
        """Fetch all fills by paginating through time windows."""
        import time as _time
        all_fills = []
        start_time = int((_time.time() - days_back * 86400) * 1000)

        while len(all_fills) < max_fills:
            payload: dict = {"type": "userFillsByTime", "user": address, "startTime": start_time}

            raw = self._post(payload)
            if not raw:
                break

            for f in raw:
                all_fills.append(Fill(
                    coin=f.get("coin", ""),
                    side=f.get("side", ""),
                    price=float(f.get("px", "0")),
                    size=float(f.get("sz", "0")),
                    time=f.get("time", 0),
                    fee=float(f.get("fee", "0")),
                    closed_pnl=float(f.get("closedPnl", "0")),
                    oid=f.get("oid", 0),
                    direction=f.get("dir", ""),
                    crossed=f.get("crossed", False),
                ))

            if len(raw) < 2000:
                break

            # Next page: start after last fill
            start_time = raw[-1]["time"] + 1

        return all_fills[:max_fills]

    def get_portfolio(self, address: str) -> dict:
        """Fetch PnL history (day/week/month/all-time)."""
        return self._post({"type": "portfolio", "user": address})

    def get_account_value(self, address: str) -> float:
        """Quick account value lookup."""
        data = self._post({"type": "clearinghouseState", "user": address})
        return float(data.get("marginSummary", {}).get("accountValue", "0"))
