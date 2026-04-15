import { ArrowUpRight, ArrowDownRight, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CopyLogEntry } from "@/lib/api";

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatLogMessage(log: CopyLogEntry): string {
  if (log.status === "risk_blocked") {
    return `Risk blocked: ${log.coin} ${log.reason}`;
  }
  const action = log.side === "B" ? "BUY" : "SELL";
  return `Paper order: ${action} ${log.size.toFixed(4)} ${log.coin} @ ${formatCurrency(log.price)} (${log.reason})`;
}

export default function ActivityFeed({ logs }: { logs: CopyLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No copy activity yet. The engine will log events here as the leader trades.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, i) => {
        const isBlocked = log.status === "risk_blocked";
        const isBuy = log.side === "B";

        return (
          <div
            key={`${log.timestamp}-${i}`}
            className="flex items-start gap-3 rounded-lg p-3 transition-colors"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <div className="mt-0.5">
              {isBlocked ? (
                <ShieldAlert size={14} className="text-[#FFD166]" />
              ) : isBuy ? (
                <ArrowUpRight size={14} className="text-profit" />
              ) : (
                <ArrowDownRight size={14} className="text-loss" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${isBlocked ? "text-[#FFD166]" : "text-secondary"}`}>
                {formatLogMessage(log)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted">
                  {formatTimeAgo(log.timestamp)}
                </span>
                <span className="text-[10px] text-muted num">
                  {log.leader_address.slice(0, 6)}...{log.leader_address.slice(-4)}
                </span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-accent"
                  style={{ background: "rgba(99,102,241,0.08)" }}
                >
                  PAPER
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
