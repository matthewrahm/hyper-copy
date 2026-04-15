"use client";

import { useCallback, useEffect, useState } from "react";
import { getCopies, getCopyLog, getCopyPerformance, getAccountValue, type CopyConfig, type CopyLogEntry, type CopyPerformance } from "@/lib/api";
import { useAutoRefresh } from "@/app/hooks/useAutoRefresh";
import { formatCurrency } from "@/lib/utils";
import SectionHeading from "./SectionHeading";
import CopyCard from "./CopyCard";
import ActivityFeed from "./ActivityFeed";

export default function CopyDashboard({ copierAddress }: { copierAddress: string }) {
  const [accountValue, setAccountValue] = useState(0);

  const fetchCopies = useCallback(() => getCopies(copierAddress), [copierAddress]);
  const fetchLog = useCallback(() => getCopyLog(copierAddress, 50), [copierAddress]);
  const fetchPerf = useCallback(() => getCopyPerformance(copierAddress), [copierAddress]);

  const { data: copies, loading: copiesLoading, refresh: refreshCopies } = useAutoRefresh(fetchCopies, 10_000);
  const { data: logs, loading: logsLoading, refresh: refreshLogs } = useAutoRefresh(fetchLog, 10_000);
  const { data: performance } = useAutoRefresh(fetchPerf, 30_000);

  useEffect(() => {
    getAccountValue(copierAddress)
      .then((d) => setAccountValue(d.account_value))
      .catch(() => {});
  }, [copierAddress]);

  const handleChanged = () => {
    refreshCopies();
    refreshLogs();
  };

  const perfMap = new Map(
    (performance || []).map((p) => [p.leader_address, p])
  );

  return (
    <div className="space-y-6">
      {/* Account header */}
      <div className="flex items-center gap-4 mb-2">
        <span className="num text-xs text-muted">
          {copierAddress.slice(0, 6)}...{copierAddress.slice(-4)}
        </span>
        {accountValue > 0 && (
          <span className="num text-xs text-secondary">
            Account: {formatCurrency(accountValue)}
          </span>
        )}
      </div>

      {/* Active copies */}
      <section>
        <SectionHeading>Active Copies</SectionHeading>

        {copiesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : !copies || copies.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-muted mb-1">No active copies</p>
            <p className="text-xs text-muted">
              Browse the leaderboard and click a trader to start copying
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {copies.map((c) => (
              <CopyCard
                key={c.leader_address}
                copy={c}
                performance={perfMap.get(c.leader_address) || null}
                leaderScore={null}
                onChanged={handleChanged}
              />
            ))}
          </div>
        )}
      </section>

      {/* Activity feed */}
      <section className="card p-5">
        <SectionHeading>Activity Feed</SectionHeading>

        {logsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : (
          <ActivityFeed logs={logs || []} />
        )}
      </section>
    </div>
  );
}
