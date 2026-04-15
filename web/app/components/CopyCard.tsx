"use client";

import { useState } from "react";
import Link from "next/link";
import { Pause, Play, X } from "lucide-react";
import { stopCopy, pauseCopy, type CopyConfig, type CopyPerformance } from "@/lib/api";
import { toast } from "@/app/hooks/useToast";
import ScoreBadge from "./ScoreBadge";

export default function CopyCard({
  copy,
  performance,
  leaderScore,
  onChanged,
}: {
  copy: CopyConfig;
  performance: CopyPerformance | null;
  leaderScore: number | null;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState("");
  const [confirmStop, setConfirmStop] = useState(false);

  const leaderShort = `${copy.leader_address.slice(0, 6)}...${copy.leader_address.slice(-4)}`;
  const isActive = copy.active;

  const handlePause = async () => {
    setLoading("pause");
    try {
      await pauseCopy(copy.copier_address, copy.leader_address);
      toast.info(isActive ? "Copy paused" : "Copy resumed");
      onChanged();
    } catch { toast.error("Failed to update copy"); } finally { setLoading(""); }
  };

  const handleStop = async () => {
    setLoading("stop");
    try {
      await stopCopy(copy.copier_address, copy.leader_address);
      toast.success(`Stopped copying ${leaderShort}`);
      onChanged();
    } catch { toast.error("Failed to stop copy"); } finally { setLoading(""); setConfirmStop(false); }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/trader/${copy.leader_address}`}
              className="num text-sm text-accent hover:text-accent-hover transition-colors"
            >
              {leaderShort}
            </Link>
            {leaderScore !== null && <ScoreBadge score={leaderScore} />}
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
              isActive ? "text-profit" : "text-muted"
            }`}
            style={{
              background: isActive
                ? "rgba(34,197,94,0.12)"
                : "rgba(255,255,255,0.06)",
            }}
          >
            {isActive ? "Paper Trading" : "Paused"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePause}
            disabled={loading === "pause"}
            className="p-1.5 rounded-md text-muted hover:text-primary transition-colors hover:bg-[rgba(255,255,255,0.06)]"
            title={isActive ? "Pause" : "Resume"}
          >
            {isActive ? <Pause size={14} /> : <Play size={14} />}
          </button>
          {confirmStop ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleStop}
                disabled={loading === "stop"}
                className="text-[10px] font-medium text-loss hover:opacity-80 disabled:opacity-40"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmStop(false)}
                className="text-[10px] text-muted hover:text-primary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmStop(true)}
              className="p-1.5 rounded-md text-muted hover:text-loss transition-colors hover:bg-[rgba(239,68,68,0.06)]"
              title="Stop copying"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Risk params */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Pill label="Max pos" value={`${(copy.config.max_position_pct * 100).toFixed(0)}%`} />
        <Pill label="Max exp" value={`${(copy.config.max_total_exposure_pct * 100).toFixed(0)}%`} />
        <Pill label="Kill switch" value={`${(copy.config.max_drawdown_pct * 100).toFixed(0)}%`} />
      </div>

      {/* Performance stats */}
      {performance && (
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{performance.total_paper_orders} paper orders</span>
          {performance.total_risk_blocked > 0 && (
            <span className="text-[#FFD166]">{performance.total_risk_blocked} blocked</span>
          )}
          {performance.first_order_at && (
            <span>Since {new Date(performance.first_order_at * 1000).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="text-[10px] text-muted px-2 py-0.5 rounded-md"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {label}: <span className="num text-secondary">{value}</span>
    </span>
  );
}
