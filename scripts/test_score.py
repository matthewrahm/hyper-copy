"""Test script for trader scoring engine."""

import sys
sys.path.insert(0, "src")

from hyper_copy.client import HyperliquidTraderClient
from hyper_copy.scorer import TraderScorer


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_score.py 0x<address>")
        return

    address = sys.argv[1]
    client = HyperliquidTraderClient()
    scorer = TraderScorer(client)

    print(f"Scoring {address[:8]}...{address[-6:]}...")
    print("Fetching fills (this may take a moment)...")

    score = scorer.score(address, days_back=90)

    print()
    print("=" * 50)
    print(f"TRADER SCORE: {score.score}/100")
    print("=" * 50)
    print(f"Account Value:    ${score.account_value:,.2f}")
    print(f"Total PnL:        ${score.total_pnl:+,.2f}")
    print(f"ROI:              {score.roi * 100:+.1f}%")
    print(f"Win Rate:         {score.win_rate * 100:.1f}%")
    print(f"Total Trades:     {score.total_trades}")
    print(f"Avg PnL/Trade:    ${score.avg_pnl_per_trade:+,.2f}")
    print(f"Max Drawdown:     {score.max_drawdown * 100:.1f}%")
    print(f"Sharpe Ratio:     {score.sharpe_ratio:.2f}")
    print(f"Avg Hold Time:    {score.avg_hold_time_hours:.1f}h")
    print(f"Trade Frequency:  {score.trade_frequency_per_day:.1f}/day")

    if score.active_since:
        from datetime import datetime
        active = datetime.fromtimestamp(score.active_since / 1000)
        print(f"Active Since:     {active.strftime('%Y-%m-%d')}")

    print()


if __name__ == "__main__":
    main()
