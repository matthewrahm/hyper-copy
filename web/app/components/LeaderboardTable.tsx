"use client";

import { useCallback, useState } from "react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import AddressCell from "./AddressCell";
import ScoreBadge from "./ScoreBadge";
import NumberCell from "./NumberCell";
import SectionHeading from "./SectionHeading";
import SubmitTrader from "./SubmitTrader";

type SortKey = keyof LeaderboardEntry;

export default function LeaderboardTable() {
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDesc, setSortDesc] = useState(true);

  const fetchLeaderboard = useCallback(
    () => getLeaderboard(50, "score", 1),
    []
  );
  const { data, loading, refresh } = useAutoRefresh(fetchLeaderboard, 30_000);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const sorted = data
    ? [...data].sort((a, b) => {
        const av = a[sortBy] as number;
        const bv = b[sortBy] as number;
        return sortDesc ? bv - av : av - bv;
      })
    : [];

  const SortHeader = ({
    label,
    field,
    align = "right",
  }: {
    label: string;
    field: SortKey;
    align?: "left" | "right";
  }) => (
    <th
      className={`table-header cursor-pointer select-none transition-colors hover:text-primary ${
        align === "right" ? "text-right" : "text-left"
      } ${sortBy === field ? "text-primary" : ""}`}
      onClick={() => handleSort(field)}
    >
      {label}
    </th>
  );

  return (
    <section className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <SectionHeading>Top Traders</SectionHeading>
        <SubmitTrader onSubmitted={refresh} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No traders tracked yet. Submit an address above to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left w-8">#</th>
                <th className="table-header text-left">Trader</th>
                <SortHeader label="Score" field="score" />
                <SortHeader label="Total PnL" field="total_pnl" />
                <SortHeader label="ROI" field="roi" />
                <SortHeader label="Win %" field="win_rate" />
                <th className="table-header text-right hidden lg:table-cell">Sharpe</th>
                <th className="table-header text-right hidden lg:table-cell">Max DD</th>
                <SortHeader label="Trades" field="total_trades" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, i) => (
                <tr key={t.address} className="table-row">
                  <td className="table-cell text-muted text-xs">{i + 1}</td>
                  <td className="table-cell">
                    <AddressCell address={t.address} />
                  </td>
                  <td className="table-cell text-right">
                    <ScoreBadge score={t.score} />
                  </td>
                  <td className="table-cell text-right">
                    <span className={`num font-medium ${t.total_pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {formatSignedCurrency(t.total_pnl)}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <NumberCell value={t.roi * 100} format="pct" colorize />
                  </td>
                  <td className="table-cell text-right">
                    <span className="num text-secondary">
                      {(t.win_rate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="table-cell text-right hidden lg:table-cell">
                    <span className="num text-secondary">
                      {t.sharpe_ratio.toFixed(2)}
                    </span>
                  </td>
                  <td className="table-cell text-right hidden lg:table-cell">
                    <span className="num text-loss">
                      {(t.max_drawdown * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="num text-secondary">{t.total_trades}</span>
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
