import { formatSignedCurrency } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/api";

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="label mb-1">{label}</div>
      <div className="num text-lg font-semibold text-primary">
        {value}{suffix && <span className="text-muted text-sm ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

export default function PnlSummary({ score }: { score: LeaderboardEntry }) {
  const pnlColor = score.total_pnl >= 0 ? "text-profit" : "text-loss";

  return (
    <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-6">
      <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="label mb-1">Total PnL</div>
        <div className={`num text-lg font-semibold ${pnlColor}`}>
          {formatSignedCurrency(score.total_pnl)}
        </div>
      </div>
      <StatCard label="ROI" value={`${(score.roi * 100).toFixed(1)}`} suffix="%" />
      <StatCard label="Win Rate" value={`${(score.win_rate * 100).toFixed(1)}`} suffix="%" />
      <StatCard label="Sharpe" value={score.sharpe_ratio.toFixed(2)} />
      <StatCard label="Max Drawdown" value={`${(score.max_drawdown * 100).toFixed(1)}`} suffix="%" />
      <StatCard label="Avg Hold" value={`${score.avg_hold_time_hours.toFixed(1)}`} suffix="h" />
    </div>
  );
}
