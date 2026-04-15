"use client";

import { useState } from "react";
import { useWallet } from "@/app/hooks/useWallet";

export default function WalletSetup({ compact = false }: { compact?: boolean }) {
  const { setAddress } = useWallet();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!setAddress(input)) {
      setError("Invalid address");
      return;
    }
    setInput("");
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0x..."
          className="w-48 rounded-lg border border-[rgba(255,255,255,0.10)] bg-transparent px-2 py-1 font-mono text-xs text-primary placeholder:text-[#555] focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-white hover:opacity-85"
        >
          Save
        </button>
        {error && <span className="text-xs text-loss">{error}</span>}
      </form>
    );
  }

  return (
    <div className="card p-6 text-center">
      <h3 className="text-lg font-semibold text-primary mb-2">Connect Your Wallet</h3>
      <p className="text-sm text-secondary mb-4">
        Enter your Hyperliquid wallet address to manage copy trading
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg mx-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hyperliquid wallet address (0x...)"
          className="flex-1 rounded-lg border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-2 font-mono text-sm text-primary placeholder:text-[#555] focus:border-accent focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-85 active:scale-[0.97]"
        >
          Connect
        </button>
      </form>
      {error && <p className="text-xs text-loss mt-2">{error}</p>}
    </div>
  );
}
