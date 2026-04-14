"""Test script for copy engine in paper mode."""

import argparse
import logging
import sys
sys.path.insert(0, "src")

from hyper_copy.client import HyperliquidTraderClient
from hyper_copy.db import Database
from hyper_copy.copy_engine import CopyEngine
from hyper_copy.models import CopyConfig

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)


def main():
    parser = argparse.ArgumentParser(description="Test copy engine")
    parser.add_argument("--leader", required=True, help="Leader address to copy")
    parser.add_argument("--copier", default="0x0000000000000000000000000000000000000001", help="Copier address")
    parser.add_argument("--interval", type=int, default=5, help="Poll interval in seconds")
    parser.add_argument("--iterations", type=int, default=12, help="Max iterations (0=unlimited)")
    args = parser.parse_args()

    client = HyperliquidTraderClient()
    db = Database()
    engine = CopyEngine(client, db)

    config = CopyConfig(
        copier_address=args.copier,
        leader_address=args.leader,
        max_position_pct=0.10,
        max_total_exposure_pct=0.50,
        max_drawdown_pct=0.15,
    )

    print(f"Leader: {args.leader[:10]}...")
    print(f"Copier: {args.copier[:10]}...")
    print(f"Interval: {args.interval}s, Max iterations: {args.iterations}")
    print(f"Risk: max_pos={config.max_position_pct:.0%}, max_exp={config.max_total_exposure_pct:.0%}")
    print()

    engine.run_paper(config, interval=args.interval, max_iterations=args.iterations)

    # Show copy log
    rows = db._conn.execute(
        "SELECT * FROM copy_log ORDER BY timestamp DESC LIMIT 20"
    ).fetchall()

    if rows:
        print(f"\nCopy Log ({len(rows)} entries):")
        for r in rows:
            print(f"  {r['coin']} {r['side']} {r['size']:.4f} @ ${r['price']:,.2f} [{r['reason']}] ({r['status']})")


if __name__ == "__main__":
    main()
