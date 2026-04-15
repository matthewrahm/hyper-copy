"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCopies, stopCopy, type LeaderboardEntry, type TraderPosition } from "@/lib/api";
import { useWallet } from "@/app/hooks/useWallet";
import CopyWizard from "./CopyWizard";

export default function CopyButton({
  traderScore,
  positions,
}: {
  traderScore: LeaderboardEntry;
  positions: TraderPosition[];
}) {
  const router = useRouter();
  const { address, isSet } = useWallet();
  const [isFollowing, setIsFollowing] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showConfirmStop, setShowConfirmStop] = useState(false);

  useEffect(() => {
    if (!isSet) return;
    getCopies(address)
      .then((copies) => {
        const found = copies.some(
          (c) => c.leader_address === traderScore.address
        );
        setIsFollowing(found);
      })
      .catch(() => {});
  }, [address, isSet, traderScore.address]);

  const handleStop = async () => {
    setStopping(true);
    try {
      await stopCopy(address, traderScore.address);
      setIsFollowing(false);
      setShowConfirmStop(false);
    } catch {
      // error
    } finally {
      setStopping(false);
    }
  };

  if (!isSet) {
    return (
      <button
        onClick={() => router.push("/copies")}
        className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors"
        style={{ border: "1px solid rgba(255,255,255,0.10)" }}
      >
        Connect wallet to copy
      </button>
    );
  }

  if (isFollowing) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-md text-profit"
          style={{ background: "rgba(34,197,94,0.12)" }}
        >
          Copying
        </span>
        {showConfirmStop ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Stop copying?</span>
            <button
              onClick={handleStop}
              disabled={stopping}
              className="text-xs font-medium text-loss hover:opacity-80 disabled:opacity-40"
            >
              {stopping ? "Stopping..." : "Yes, stop"}
            </button>
            <button
              onClick={() => setShowConfirmStop(false)}
              className="text-xs text-muted hover:text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmStop(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-loss transition-colors hover:bg-loss/10"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}
          >
            Stop
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
      >
        Copy This Trader
      </button>

      {showWizard && (
        <CopyWizard
          traderScore={traderScore}
          positions={positions}
          onClose={() => setShowWizard(false)}
        />
      )}
    </>
  );
}
