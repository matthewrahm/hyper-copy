"""Test script for leaderboard builder."""

import logging
import sys
sys.path.insert(0, "src")

from hyper_copy.leaderboard import LeaderboardManager

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)


def main():
    mgr = LeaderboardManager()

    print("Seeding addresses...")
    mgr.seed()

    print("Scoring all traders (this takes a while with rate limiting)...")
    mgr.refresh_all(delay=1.0)

    print()
    print("=" * 90)
    print("LEADERBOARD")
    print("=" * 90)
    print(f"{'#':<3} {'Address':<16} {'Score':>6} {'PnL':>12} {'ROI':>8} {'Win%':>6} {'Sharpe':>7} {'DD%':>6} {'Trades':>7}")
    print("-" * 90)

    board = mgr.get_leaderboard(limit=20, sort_by="score", min_trades=1)
    for i, t in enumerate(board, 1):
        addr = t["address"]
        short = f"{addr[:6]}...{addr[-4:]}"
        print(
            f"{i:<3} {short:<16} "
            f"{t['score']:>6.1f} "
            f"${t['total_pnl']:>10,.2f} "
            f"{t['roi'] * 100:>7.1f}% "
            f"{t['win_rate'] * 100:>5.1f}% "
            f"{t['sharpe_ratio']:>7.2f} "
            f"{t['max_drawdown'] * 100:>5.1f}% "
            f"{t['total_trades']:>7}"
        )

    print(f"\nTotal scored: {len(board)}")
    print("Done.")


if __name__ == "__main__":
    main()
