"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTrader, type TraderProfile } from "@/lib/api";
import Header from "@/app/components/Header";
import TraderHeader from "@/app/components/TraderHeader";
import PnlSummary from "@/app/components/PnlSummary";
import ScoreBreakdown from "@/app/components/ScoreBreakdown";
import PositionsTable from "@/app/components/PositionsTable";
import FillsTable from "@/app/components/FillsTable";
import CopyButton from "@/app/components/CopyButton";

export default function TraderDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getTrader(address)
      .then(setProfile)
      .catch(() => setError("Failed to load trader data"))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to leaderboard
      </Link>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-16 w-full" />
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20" />
            ))}
          </div>
          <div className="skeleton h-48 w-full" />
        </div>
      ) : error ? (
        <div className="card p-5">
          <p className="text-sm text-loss">{error}</p>
        </div>
      ) : profile ? (
        <>
          <div className="flex items-start justify-between">
            <TraderHeader score={profile.score} />
            <CopyButton
              leaderAddress={address}
              copierAddress=""
              isFollowing={false}
              onChanged={() => {}}
            />
          </div>
          <PnlSummary score={profile.score} />
          <ScoreBreakdown score={profile.score} />
          <PositionsTable address={address} />
          <FillsTable address={address} />
        </>
      ) : null}
    </div>
  );
}
