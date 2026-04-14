"use client";

import { useCallback } from "react";
import Link from "next/link";
import { getCopies, getCopyLog, type CopyConfig, type CopyLogEntry } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { formatCurrency } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import ScoreBadge from "./ScoreBadge";

export default function CopyDashboard({ copierAddress }: { copierAddress: string }) {
  const fetchCopies = useCallback(() => getCopies(copierAddress), [copierAddress]);
  const fetchLog = useCallback(() => getCopyLog(copierAddress, 50), [copierAddress]);

  const { data: copies, loading: copiesLoading } = useAutoRefresh(fetchCopies, 10_000);
  const { data: logs, loading: logsLoading } = useAutoRefresh(fetchLog, 10_000);

  return (
    <div className="space-y-6">
      {/* Active copies */}
      <section className="card p-5">
        <SectionHeading>Active Copies</SectionHeading>

        {copiesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : !copies || copies.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted mb-2">No active copies</p>
            <p className="text-xs text-muted">
              Browse the{" "}
              <Link href="/" className="text-accent hover:text-accent-hover">
                leaderboard
              </Link>{" "}
              and click a trader to start copying
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {copies.map((c) => (
              <div
                key={c.leader_address}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div>
                  <Link
                    href={`/trader/${c.leader_address}`}
                    className="num text-sm text-accent hover:text-accent-hover"
                  >
                    {c.leader_address.slice(0, 6)}...{c.leader_address.slice(-4)}
                  </Link>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    <span>Max pos: {(c.config.max_position_pct * 100).toFixed(0)}%</span>
                    <span>Max exp: {(c.config.max_total_exposure_pct * 100).toFixed(0)}%</span>
                    <span>Max DD: {(c.config.max_drawdown_pct * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-md text-profit"
                  style={{ background: "rgba(34, 197, 94, 0.12)" }}
                >
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Copy log */}
      <section className="card p-5">
        <SectionHeading>Copy Log</SectionHeading>

        {logsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-full" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No copy orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header text-left">Time</th>
                  <th className="table-header text-left">Leader</th>
                  <th className="table-header text-left">Coin</th>
                  <th className="table-header text-left">Side</th>
                  <th className="table-header text-right">Size</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-left">Reason</th>
                  <th className="table-header text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => {
                  const time = new Date(l.timestamp * 1000).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  });
                  const statusColor = l.status === "filled" ? "text-profit" : l.status === "rejected" ? "text-loss" : "text-muted";
                  return (
                    <tr key={`${l.timestamp}-${i}`} className="table-row">
                      <td className="table-cell text-xs text-muted">{time}</td>
                      <td className="table-cell num text-xs text-secondary">
                        {l.leader_address.slice(0, 6)}...{l.leader_address.slice(-4)}
                      </td>
                      <td className="table-cell font-medium text-primary">{l.coin}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium ${l.side === "B" ? "text-profit" : "text-loss"}`}>
                          {l.side === "B" ? "BUY" : "SELL"}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="num text-secondary">{l.size.toFixed(4)}</span>
                      </td>
                      <td className="table-cell text-right">
                        <span className="num text-secondary">{formatCurrency(l.price)}</span>
                      </td>
                      <td className="table-cell text-xs text-muted">{l.reason}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium ${statusColor}`}>{l.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
