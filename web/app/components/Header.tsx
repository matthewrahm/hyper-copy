"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/app/hooks/useWallet";
import WalletSetup from "./WalletSetup";

export default function Header() {
  const { address, clearAddress, isSet } = useWallet();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const truncated = isSet
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <Link href="/">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            hyper-copy
          </h1>
        </Link>
        <p className="mt-1 text-sm text-muted">
          Track, score, and copy top Hyperliquid traders
        </p>
      </div>
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/copies"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            My Copies
          </Link>
        </nav>

        {isSet ? (
          <div className="relative">
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono text-secondary transition-colors hover:text-primary"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-profit" />
              {truncated}
            </button>
            {showWalletMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-lg p-3 z-50"
                style={{
                  background: "#27272a",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                }}
              >
                <p className="text-xs text-muted mb-2 break-all font-mono">{address}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                      setShowWalletMenu(false);
                    }}
                    className="text-xs text-secondary hover:text-primary"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      clearAddress();
                      setShowWalletMenu(false);
                    }}
                    className="text-xs text-loss hover:opacity-80"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : showSetup ? (
          <WalletSetup compact />
        ) : (
          <button
            onClick={() => setShowSetup(true)}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-85"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
