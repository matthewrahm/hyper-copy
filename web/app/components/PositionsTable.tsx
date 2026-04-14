"use client";

import { useCallback } from "react";
import { getTraderPositions, type TraderPosition } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

export default function PositionsTable({ address }: { address: string }) {
  const fetchPositions = useCallback(
    () => getTraderPositions(address),
    [address]
  );
  const { data: positions, loading } = useAutoRefresh(fetchPositions, 10_000);

  return (
    <section className="card p-5 mb-6">
      <SectionHeading>Open Positions</SectionHeading>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : !positions || positions.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No open positions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Coin</th>
                <th className="table-header text-left">Side</th>
                <th className="table-header text-right">Size</th>
                <th className="table-header text-right">Entry</th>
                <th className="table-header text-right">Mark</th>
                <th className="table-header text-right">uPnL</th>
                <th className="table-header text-right hidden sm:table-cell">Lev</th>
                <th className="table-header text-right hidden sm:table-cell">Value</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.coin} className="table-row">
                  <td className="table-cell font-medium text-primary">{p.coin}</td>
                  <td className="table-cell">
                    <span className={`text-xs font-semibold ${p.side === "LONG" ? "text-profit" : "text-loss"}`}>
                      {p.side}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="num text-secondary">{p.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="num text-secondary">{formatCurrency(p.entry_price)}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="num text-secondary">{formatCurrency(p.mark_price)}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`num font-medium ${p.unrealized_pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatSignedCurrency(p.unrealized_pnl)}
                    </span>
                  </td>
                  <td className="table-cell text-right hidden sm:table-cell">
                    <span className="num text-muted">{p.leverage}x</span>
                  </td>
                  <td className="table-cell text-right hidden sm:table-cell">
                    <span className="num text-secondary">{formatCurrency(p.position_value)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
