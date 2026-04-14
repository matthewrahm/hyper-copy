import Link from "next/link";

export default function Header() {
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
    </header>
  );
}
