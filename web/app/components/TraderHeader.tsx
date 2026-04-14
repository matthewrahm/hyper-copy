import { formatCurrency } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import type { LeaderboardEntry } from "@/lib/api";

export default function TraderHeader({ score }: { score: LeaderboardEntry }) {
  const activeDate = score.active_since
    ? new Date(score.active_since).toLocaleDateString()
    : "Unknown";

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="num text-lg font-semibold text-primary">
            {score.address.slice(0, 6)}...{score.address.slice(-4)}
          </h2>
          <ScoreBadge score={score.score} />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>Account: {formatCurrency(score.account_value)}</span>
          <span>Active since {activeDate}</span>
        </div>
      </div>
    </div>
  );
}
