"""Test script for Hyperliquid trader data fetcher."""

import sys
sys.path.insert(0, "src")

from hyper_copy.client import HyperliquidTraderClient


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_fetch.py 0x<address>")
        return

    address = sys.argv[1]
    client = HyperliquidTraderClient()

    # Account snapshot
    print("=" * 70)
    print(f"TRADER: {address[:8]}...{address[-6:]}")
    print("=" * 70)

    snapshot = client.get_snapshot(address)
    print(f"Account Value: ${snapshot.account_value:,.2f}")
    print(f"Margin Used:   ${snapshot.total_margin_used:,.2f}")
    print(f"Withdrawable:  ${snapshot.withdrawable:,.2f}")

    # Positions
    print(f"\nPositions ({len(snapshot.positions)}):")
    print(f"{'Coin':<10} {'Side':<6} {'Size':>12} {'Entry':>12} {'Mark':>12} {'uPnL':>12} {'Lev':>4}")
    print("-" * 70)
    for p in snapshot.positions:
        print(
            f"{p.coin:<10} {p.side:<6} "
            f"{p.size:>12,.4f} "
            f"${p.entry_price:>10,.2f} "
            f"${p.mark_price:>10,.2f} "
            f"${p.unrealized_pnl:>10,.2f} "
            f"{p.leverage:>3}x"
        )

    # Recent fills
    fills = client.get_fills(address, limit=20)
    print(f"\nRecent Fills ({len(fills)}):")
    print(f"{'Coin':<10} {'Dir':<14} {'Price':>12} {'Size':>10} {'PnL':>12} {'Fee':>8}")
    print("-" * 70)
    for f in fills[:20]:
        print(
            f"{f.coin:<10} {f.direction:<14} "
            f"${f.price:>10,.2f} "
            f"{f.size:>10,.4f} "
            f"${f.closed_pnl:>10,.2f} "
            f"${f.fee:>6,.2f}"
        )

    # Portfolio PnL
    portfolio = client.get_portfolio(address)
    if portfolio:
        print(f"\nPortfolio:")
        for period_name, period_data in portfolio:
            history = period_data.get("accountValueHistory", [])
            if len(history) >= 2:
                start_val = float(history[0][1])
                end_val = float(history[-1][1])
                change = end_val - start_val
                print(f"  {period_name}: ${end_val:,.2f} ({change:+,.2f})")

    print("\nDone.")


if __name__ == "__main__":
    main()
