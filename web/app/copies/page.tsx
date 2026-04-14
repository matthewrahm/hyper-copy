"use client";

import { useState } from "react";
import Header from "@/app/components/Header";
import CopyDashboard from "@/app/components/CopyDashboard";

export default function CopiesPage() {
  const [address, setAddress] = useState("");
  const [activeAddress, setActiveAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
      setActiveAddress(address);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <div className="card p-5 mb-6">
        <div className="label mb-3">Your Wallet</div>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your Hyperliquid address (0x...)"
            className="flex-1 rounded-lg border border-[rgba(255,255,255,0.10)] bg-transparent px-3 py-2 font-mono text-sm text-primary placeholder:text-[#555] transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[rgba(99,102,241,0.15)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
          >
            View Copies
          </button>
        </form>
      </div>

      {activeAddress && <CopyDashboard copierAddress={activeAddress} />}
    </div>
  );
}
