import json
import sqlite3
import time
from pathlib import Path

from hyper_copy.models import TraderScore


DB_PATH = Path(__file__).parent.parent.parent / "data" / "hyper_copy.db"


class Database:
    """SQLite persistence for trader scores and copy configs."""

    def __init__(self, path: Path | None = None):
        self.path = path or DB_PATH
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(str(self.path))
        self._conn.row_factory = sqlite3.Row
        self._init_tables()

    def _init_tables(self):
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS traders (
                address TEXT PRIMARY KEY,
                total_pnl REAL DEFAULT 0,
                roi REAL DEFAULT 0,
                win_rate REAL DEFAULT 0,
                total_trades INTEGER DEFAULT 0,
                avg_pnl_per_trade REAL DEFAULT 0,
                max_drawdown REAL DEFAULT 0,
                sharpe_ratio REAL DEFAULT 0,
                avg_hold_time_hours REAL DEFAULT 0,
                trade_frequency_per_day REAL DEFAULT 0,
                active_since INTEGER DEFAULT 0,
                account_value REAL DEFAULT 0,
                score REAL DEFAULT 0,
                scored_at REAL DEFAULT 0,
                submitted_by TEXT DEFAULT NULL
            );

            CREATE TABLE IF NOT EXISTS copy_configs (
                copier_address TEXT,
                leader_address TEXT,
                config TEXT DEFAULT '{}',
                active INTEGER DEFAULT 1,
                created_at REAL DEFAULT 0,
                PRIMARY KEY (copier_address, leader_address)
            );

            CREATE TABLE IF NOT EXISTS copy_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                copier_address TEXT,
                leader_address TEXT,
                coin TEXT,
                side TEXT,
                size REAL,
                price REAL,
                order_type TEXT,
                reason TEXT,
                status TEXT DEFAULT 'paper',
                error TEXT DEFAULT NULL
            );
        """)
        self._conn.commit()

    def upsert_trader(self, score: TraderScore):
        """Insert or update a trader's score."""
        self._conn.execute("""
            INSERT INTO traders (
                address, total_pnl, roi, win_rate, total_trades,
                avg_pnl_per_trade, max_drawdown, sharpe_ratio,
                avg_hold_time_hours, trade_frequency_per_day,
                active_since, account_value, score, scored_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(address) DO UPDATE SET
                total_pnl=excluded.total_pnl,
                roi=excluded.roi,
                win_rate=excluded.win_rate,
                total_trades=excluded.total_trades,
                avg_pnl_per_trade=excluded.avg_pnl_per_trade,
                max_drawdown=excluded.max_drawdown,
                sharpe_ratio=excluded.sharpe_ratio,
                avg_hold_time_hours=excluded.avg_hold_time_hours,
                trade_frequency_per_day=excluded.trade_frequency_per_day,
                active_since=excluded.active_since,
                account_value=excluded.account_value,
                score=excluded.score,
                scored_at=excluded.scored_at
        """, (
            score.address, score.total_pnl, score.roi, score.win_rate,
            score.total_trades, score.avg_pnl_per_trade, score.max_drawdown,
            score.sharpe_ratio, score.avg_hold_time_hours,
            score.trade_frequency_per_day, score.active_since,
            score.account_value, score.score, score.scored_at,
        ))
        self._conn.commit()

    def add_trader(self, address: str, submitted_by: str | None = None):
        """Add an address for tracking (doesn't score yet)."""
        self._conn.execute(
            "INSERT OR IGNORE INTO traders (address, submitted_by) VALUES (?, ?)",
            (address, submitted_by),
        )
        self._conn.commit()

    def get_trader(self, address: str) -> dict | None:
        row = self._conn.execute(
            "SELECT * FROM traders WHERE address = ?", (address,)
        ).fetchone()
        return dict(row) if row else None

    def get_leaderboard(
        self,
        limit: int = 50,
        sort_by: str = "score",
        min_trades: int = 5,
    ) -> list[dict]:
        valid_sorts = {"score", "total_pnl", "roi", "win_rate", "sharpe_ratio", "total_trades"}
        if sort_by not in valid_sorts:
            sort_by = "score"

        rows = self._conn.execute(
            f"""SELECT * FROM traders
                WHERE total_trades >= ? AND scored_at > 0
                ORDER BY {sort_by} DESC
                LIMIT ?""",
            (min_trades, limit),
        ).fetchall()
        return [dict(r) for r in rows]

    def get_all_addresses(self) -> list[str]:
        rows = self._conn.execute("SELECT address FROM traders").fetchall()
        return [r["address"] for r in rows]

    def close(self):
        self._conn.close()
