import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, LogIn, Sparkles } from "lucide-react";
import { CircleCard } from "@/components/CircleCard";
import { WalletCard } from "@/components/WalletCard";
import { LiveEventFeed } from "@/components/LiveEventFeed";
import { FullSpinner } from "@/components/Spinner";
import { getAllCircles } from "@/lib/contract";
import type { CircleInfo } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";

export function Dashboard() {
  const { address } = useWallet();
  const [circles, setCircles] = useState<CircleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const all = await getAllCircles();
      if (aliveRef.current) setCircles(all);
    } catch {
      if (aliveRef.current) setCircles([]);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(load, 60_000);
    return () => { aliveRef.current = false; clearInterval(id); };
  }, [load]);

  const activeCount = circles.filter((c) => c.state === "Active").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 text-white shadow-card-hover sm:p-10">
        <div className="flex items-center gap-2 text-brand-100">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Trustless Rotating Savings
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Save together. Payout transparently. Default-proof on Stellar.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-brand-100 sm:text-base">
          Nova Esusu brings the centuries-old rotating savings circle (Esusu /
          Ajo) on-chain — sub-cent fees, automated payouts, and a reputation
          system that keeps everyone honest.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-semibold text-brand-700 dark:text-brand-300 shadow-card transition hover:bg-brand-50 dark:hover:bg-brand-500/15"
          >
            <PlusCircle className="h-4 w-4" /> Create Circle
          </Link>
          <Link
            to="/join"
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <LogIn className="h-4 w-4" /> Join Circle
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Circles */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Circles</h2>
            <button
              onClick={load}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <FullSpinner label="Loading circles from the network…" />
          ) : circles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No circles yet. Be the first to create one!
              </p>
              <Link
                to="/create"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <PlusCircle className="h-4 w-4" /> Create Circle
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {circles.map((c, i) => (
                <CircleCard
                  key={i}
                  circle={c}
                  circleId={i + 1}
                  self={address}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <WalletCard activeCircles={activeCount} />
          <LiveEventFeed compact />
        </aside>
      </div>
    </div>
  );
}
