"use client";

import Header from "@/app/components/Header";
import CopyDashboard from "@/app/components/CopyDashboard";
import WalletSetup from "@/app/components/WalletSetup";
import { useWallet } from "@/app/hooks/useWallet";

export default function CopiesPage() {
  const { address, isSet } = useWallet();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      {isSet ? (
        <CopyDashboard copierAddress={address} />
      ) : (
        <WalletSetup />
      )}
    </div>
  );
}
