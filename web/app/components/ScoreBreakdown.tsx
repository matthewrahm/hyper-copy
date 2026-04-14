import type { LeaderboardEntry } from "@/lib/api";
import SectionHeading from "./SectionHeading";

function ScoreBar({ label, value, maxLabel }: { label: string; value: number; maxLabel: string }) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const color = clamped >= 0.7 ? "#22c55e" : clamped >= 0.4 ? "#FFD166" : "#ef4444";

  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs text-muted w-24 text-right">{label}</span>
      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${clamped * 100}%`, background: color }}
        />
      </div>
      <span className="num text-xs text-muted w-16">{maxLabel}</span>
    </div>
  );
}

export default function ScoreBreakdown({ score }: { score: LeaderboardEntry }) {
  const roiNorm = Math.min(Math.max(score.roi, 0), 5) / 5;
  const wrNorm = score.win_rate;
  const sharpeNorm = Math.min(Math.max(score.sharpe_ratio, 0), 5) / 5;
  const ddNorm = 1 - Math.min(score.max_drawdown, 1);
  const tradeNorm = Math.min(score.total_trades / 100, 1);

  return (
    <section className="card p-5 mb-6">
      <SectionHeading>Score Breakdown</SectionHeading>
      <div className="mt-2">
        <ScoreBar label="ROI (25%)" value={roiNorm} maxLabel={`${(score.roi * 100).toFixed(1)}%`} />
        <ScoreBar label="Win Rate (20%)" value={wrNorm} maxLabel={`${(score.win_rate * 100).toFixed(1)}%`} />
        <ScoreBar label="Sharpe (20%)" value={sharpeNorm} maxLabel={score.sharpe_ratio.toFixed(2)} />
        <ScoreBar label="Drawdown (15%)" value={ddNorm} maxLabel={`${(score.max_drawdown * 100).toFixed(1)}%`} />
        <ScoreBar label="Trades (10%)" value={tradeNorm} maxLabel={`${score.total_trades}`} />
      </div>
    </section>
  );
}
