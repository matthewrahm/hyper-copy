"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createCopy, getAccountValue, type LeaderboardEntry, type TraderPosition } from "@/lib/api";
import { useWallet } from "@/app/hooks/useWallet";
import { toast } from "@/app/hooks/useToast";
import { formatCurrency, truncateAddress } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";

function StepIndicator({ current }: { current: number }) {
  const steps = ["Review Trader", "Set Risk", "Confirm"];
  return (
    <div className="flex items-center justify-center gap-6 mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : isDone
                    ? "bg-profit/20 text-profit"
                    : "bg-[rgba(255,255,255,0.06)] text-muted"
              }`}
            >
              {isDone ? "\u2713" : step}
            </div>
            <span
              className={`text-xs font-medium ${
                isActive ? "text-primary" : "text-muted"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getTradingStyle(avgHoldHours: number, freqPerDay: number): string {
  let style = "";
  if (avgHoldHours > 48) style = "Position trader";
  else if (avgHoldHours > 12) style = "Swing trader";
  else if (avgHoldHours > 1) style = "Day trader";
  else style = "Scalper";

  if (freqPerDay > 10) style += ", highly active";
  else if (freqPerDay > 3) style += ", moderately active";
  else style += ", selective";

  return style;
}

export default function CopyWizard({
  traderScore,
  positions,
  onClose,
}: {
  traderScore: LeaderboardEntry;
  positions: TraderPosition[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { address: walletAddress } = useWallet();
  const [step, setStep] = useState(1);
  const [accountValue, setAccountValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Risk params
  const [maxPos, setMaxPos] = useState(10);
  const [maxExp, setMaxExp] = useState(50);
  const [maxDD, setMaxDD] = useState(15);

  useEffect(() => {
    if (walletAddress) {
      getAccountValue(walletAddress)
        .then((d) => setAccountValue(d.account_value))
        .catch(() => {});
    }
  }, [walletAddress]);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await createCopy({
        copier_address: walletAddress,
        leader_address: traderScore.address,
        max_position_pct: maxPos / 100,
        max_total_exposure_pct: maxExp / 100,
        max_drawdown_pct: maxDD / 100,
      });
      toast.success(`Started paper trading ${truncateAddress(traderScore.address)}`);
      router.push("/copies");
    } catch {
      setError("Failed to create copy. Try again.");
      toast.error("Failed to start copy trading");
    } finally {
      setLoading(false);
    }
  };

  const leaderShort = `${traderScore.address.slice(0, 6)}...${traderScore.address.slice(-4)}`;
  const tradingStyle = getTradingStyle(
    traderScore.avg_hold_time_hours,
    traderScore.trade_frequency_per_day
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="relative w-full max-w-lg rounded-xl p-6"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 40%), #18181b",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-muted hover:text-primary transition-colors"
        >
          <X size={16} />
        </button>

        <StepIndicator current={step} />

        {/* Step 1: Review */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Review Trader</h3>

            <div className="flex items-center gap-3 mb-4">
              <span className="num text-sm text-accent">{leaderShort}</span>
              <ScoreBadge score={traderScore.score} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Stat label="Win Rate" value={`${(traderScore.win_rate * 100).toFixed(1)}%`} />
              <Stat label="ROI" value={`${(traderScore.roi * 100).toFixed(1)}%`} />
              <Stat label="Max Drawdown" value={`${(traderScore.max_drawdown * 100).toFixed(1)}%`} />
              <Stat label="Avg Hold Time" value={`${traderScore.avg_hold_time_hours.toFixed(1)}h`} />
            </div>

            <div className="rounded-lg p-3 mb-4" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-xs text-muted">Trading Style</span>
              <p className="text-sm text-primary font-medium">{tradingStyle}</p>
            </div>

            {positions.length > 0 && (
              <div className="text-xs text-muted mb-4">
                Currently holding {positions.length} position{positions.length > 1 ? "s" : ""}: {positions.map(p => `${p.coin} ${p.side}`).join(", ")}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:opacity-85 active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Risk */}
        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">Set Your Risk</h3>
            {accountValue > 0 && (
              <p className="text-xs text-muted mb-4">
                Your account: {formatCurrency(accountValue)}
              </p>
            )}

            <div className="space-y-5 mb-6">
              <RiskSlider
                label="Max position size"
                description="Maximum any single copied position can be"
                value={maxPos}
                min={1}
                max={50}
                onChange={setMaxPos}
                accountValue={accountValue}
              />
              <RiskSlider
                label="Max total exposure"
                description="Maximum total capital in all copied positions combined"
                value={maxExp}
                min={10}
                max={100}
                onChange={setMaxExp}
                accountValue={accountValue}
              />
              <RiskSlider
                label="Max drawdown (kill switch)"
                description="Automatically stops copying if your account drops by this much"
                value={maxDD}
                min={5}
                max={50}
                onChange={setMaxDD}
                accountValue={accountValue}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-muted hover:text-primary transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:opacity-85 active:scale-[0.99]"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Confirm Copy</h3>

            <div className="rounded-lg p-4 mb-4 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
              <Row label="Leader" value={leaderShort} />
              <Row label="Your wallet" value={`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`} />
              <Row label="Max position" value={`${maxPos}%${accountValue > 0 ? ` (${formatCurrency(accountValue * maxPos / 100)})` : ""}`} />
              <Row label="Max exposure" value={`${maxExp}%${accountValue > 0 ? ` (${formatCurrency(accountValue * maxExp / 100)})` : ""}`} />
              <Row label="Kill switch" value={`${maxDD}%${accountValue > 0 ? ` (${formatCurrency(accountValue * maxDD / 100)})` : ""}`} />
            </div>

            <div
              className="rounded-lg p-3 mb-4 text-center"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px dashed rgba(99,102,241,0.3)",
              }}
            >
              <span className="text-xs font-semibold text-accent">PAPER MODE</span>
              <p className="text-xs text-muted mt-1">
                No real orders will be placed. The engine will track the leader and log
                what it would trade so you can evaluate performance first.
              </p>
            </div>

            {error && <p className="text-xs text-loss mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-muted hover:text-primary transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:opacity-85 active:scale-[0.99] disabled:opacity-40"
              >
                {loading ? "Setting up..." : "Start Paper Trading"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="text-[10px] text-muted uppercase tracking-wide">{label}</div>
      <div className="num text-sm font-semibold text-primary">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className="num text-xs text-primary">{value}</span>
    </div>
  );
}

function RiskSlider({
  label,
  description,
  value,
  min,
  max,
  onChange,
  accountValue,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  accountValue: number;
}) {
  const dollarValue = accountValue > 0 ? formatCurrency(accountValue * value / 100) : "";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-primary font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="num text-sm text-accent font-semibold">{value}%</span>
          {dollarValue && (
            <span className="num text-xs text-muted">({dollarValue})</span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted mb-2">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  );
}
