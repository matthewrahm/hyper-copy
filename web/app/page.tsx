import Header from "./components/Header";

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header />

      <section className="card p-5 mb-6">
        <div className="label mb-4">Top Traders</div>
        <p className="text-sm text-secondary">Loading leaderboard...</p>
      </section>
    </div>
  );
}
