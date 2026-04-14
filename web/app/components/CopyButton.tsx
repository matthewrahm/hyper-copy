"use client";

import { useState } from "react";
import { createCopy, stopCopy } from "@/lib/api";

export default function CopyButton({
  leaderAddress,
  copierAddress,
  isFollowing,
  onChanged,
}: {
  leaderAddress: string;
  copierAddress: string;
  isFollowing: boolean;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [maxPos, setMaxPos] = useState(10);
  const [maxExp, setMaxExp] = useState(50);
  const [maxDD, setMaxDD] = useState(15);

  const handleFollow = async () => {
    setLoading(true);
    try {
      await createCopy({
        copier_address: copierAddress,
        leader_address: leaderAddress,
        max_position_pct: maxPos / 100,
        max_total_exposure_pct: maxExp / 100,
        max_drawdown_pct: maxDD / 100,
      });
      setShowConfig(false);
      onChanged();
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await stopCopy(copierAddress, leaderAddress);
      onChanged();
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <button
        onClick={handleUnfollow}
        disabled={loading}
        className="rounded-lg border border-loss/30 px-4 py-2 text-sm font-medium text-loss transition-colors hover:bg-loss/10 disabled:opacity-40"
      >
        {loading ? "Stopping..." : "Stop Copying"}
      </button>
    );
  }

  if (showConfig) {
    return (
      <div className="card p-4 space-y-3">
        <div className="label">Risk Parameters</div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Max position size</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1} max={50} value={maxPos}
              onChange={(e) => setMaxPos(Number(e.target.value))}
              className="w-24 accent-accent"
            />
            <span className="num text-xs text-primary w-8">{maxPos}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Max total exposure</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10} max={100} value={maxExp}
              onChange={(e) => setMaxExp(Number(e.target.value))}
              className="w-24 accent-accent"
            />
            <span className="num text-xs text-primary w-8">{maxExp}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Max drawdown (kill switch)</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5} max={50} value={maxDD}
              onChange={(e) => setMaxDD(Number(e.target.value))}
              className="w-24 accent-accent"
            />
            <span className="num text-xs text-primary w-8">{maxDD}%</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleFollow}
            disabled={loading}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 disabled:opacity-40"
          >
            {loading ? "Setting up..." : "Confirm"}
          </button>
          <button
            onClick={() => setShowConfig(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfig(true)}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
    >
      Copy This Trader
    </button>
  );
}
