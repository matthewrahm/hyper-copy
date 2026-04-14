"use client";

import { useState } from "react";
import { submitTrader } from "@/lib/api";

export default function SubmitTrader({ onSubmitted }: { onSubmitted: () => void }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setMessage("Invalid address");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const result = await submitTrader(address);
      setMessage(
        result.score !== null
          ? `Scored: ${result.score.toFixed(1)}/100`
          : "Added for tracking"
      );
      setAddress("");
      onSubmitted();
    } catch {
      setMessage("Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Track a trader (0x...)"
        className="w-72 rounded-lg border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-1.5 font-mono text-xs text-primary placeholder:text-[#555] transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-85 active:scale-[0.97] disabled:opacity-40"
      >
        {loading ? "Scoring..." : "Add"}
      </button>
      {message && (
        <span className={`text-xs ${message.startsWith("Scored") ? "text-profit" : message === "Invalid address" || message === "Failed to submit" ? "text-loss" : "text-secondary"}`}>
          {message}
        </span>
      )}
    </form>
  );
}
