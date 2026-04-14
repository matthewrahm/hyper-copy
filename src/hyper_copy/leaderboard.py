import logging
import time

from hyper_copy.client import HyperliquidTraderClient
from hyper_copy.scorer import TraderScorer
from hyper_copy.db import Database
from hyper_copy.seeds import SEED_ADDRESSES

logger = logging.getLogger(__name__)


class LeaderboardManager:
    """Manages the trader leaderboard."""

    def __init__(self, db: Database | None = None):
        self.client = HyperliquidTraderClient()
        self.scorer = TraderScorer(self.client)
        self.db = db or Database()

    def seed(self):
        """Add seed addresses if not already tracked."""
        for addr in SEED_ADDRESSES:
            self.db.add_trader(addr, submitted_by="seed")
        logger.info(f"Seeded {len(SEED_ADDRESSES)} addresses")

    def add_trader(self, address: str, submitted_by: str | None = None) -> dict | None:
        """Add and immediately score a trader."""
        self.db.add_trader(address, submitted_by)
        return self.refresh_trader(address)

    def refresh_trader(self, address: str) -> dict | None:
        """Re-score a single trader."""
        try:
            score = self.scorer.score(address)
            self.db.upsert_trader(score)
            logger.info(f"Scored {address[:10]}... = {score.score}/100 ({score.total_trades} trades)")
            return self.db.get_trader(address)
        except Exception as e:
            logger.error(f"Failed to score {address[:10]}...: {e}")
            return None

    def refresh_all(self, delay: float = 1.0):
        """Re-score all tracked traders with rate limiting."""
        addresses = self.db.get_all_addresses()
        logger.info(f"Refreshing {len(addresses)} traders...")

        scored = 0
        for addr in addresses:
            result = self.refresh_trader(addr)
            if result:
                scored += 1
            time.sleep(delay)

        logger.info(f"Refreshed {scored}/{len(addresses)} traders")

    def get_leaderboard(
        self,
        limit: int = 50,
        sort_by: str = "score",
        min_trades: int = 5,
    ) -> list[dict]:
        return self.db.get_leaderboard(limit, sort_by, min_trades)

    def get_trader(self, address: str) -> dict | None:
        return self.db.get_trader(address)
