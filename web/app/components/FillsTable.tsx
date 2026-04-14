"use client";

import { useCallback } from "react";
import { getTraderFills, type TraderFill } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

export default function FillsTable({ address }: { address: string }) {
  const fetchFills = useCallback(
    () => getTraderFills(address, 50),
    [address]
  );
  const { data: fills, loading } = useAutoRefresh(fetchFills, 30_000);

  return (
    <section className="card p-5 mb-6">
      <SectionHeading>Recent Trades</SectionHeading>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : !fills || fills.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No recent trades</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Time</th>
                <th className="table-header text-left">Coin</th>
                <th className="table-header text-left">Direction</th>
                <th className="table-header text-right">Price</th>
                <th className="table-header text-right">Size</th>
                <th className="table-header text-right">Realized PnL</th>
                <th className="table-header text-right hidden sm:table-cell">Fee</th>
              </tr>
            </thead>
            <tbody>
              {fills.map((f, i) => {
                const time = new Date(f.time).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isClose = f.direction.startsWith("Close");
                return (
                  <tr key={`${f.time}-${i}`} className="table-row">
                    <td className="table-cell text-xs text-muted">{time}</td>
                    <td className="table-cell font-medium text-primary">{f.coin}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${
                        f.direction.includes("Long") ? "text-profit" : "text-loss"
                      }`}>
                        {f.direction}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="num text-secondary">{formatCurrency(f.price)}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="num text-secondary">{f.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                    </td>
                    <td className="table-cell text-right">
                      {isClose && f.closed_pnl !== 0 ? (
                        <span className={`num font-medium ${f.closed_pnl >= 0 ? "text-profit" : "text-loss"}`}>
                          {formatSignedCurrency(f.closed_pnl)}
                        </span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </td>
                    <td className="table-cell text-right hidden sm:table-cell">
                      <span className="num text-muted">{formatCurrency(f.fee)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
