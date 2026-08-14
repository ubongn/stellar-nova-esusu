import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpCircle,
  Banknote,
  CircleDollarSign,
  UserPlus,
  AlertOctagon,
  Shield,
} from "lucide-react";
import { fetchEvents, startEventPolling } from "@/lib/events";
import type { FeedEvent } from "@/lib/types";
import { cx } from "@/lib/utils";
import { FullSpinner } from "./Spinner";

const KIND_ICON: Record<FeedEvent["kind"], typeof Activity> = {
  created: CircleDollarSign,
  joined: UserPlus,
  activated: Activity,
  contrib: ArrowUpCircle,
  payout: Banknote,
  default: AlertOctagon,
  rep: Shield,
  invite: UserPlus,
  reg: UserPlus,
  other: Activity,
};

const KIND_COLOR: Record<FeedEvent["kind"], string> = {
  created: "bg-brand-50 text-brand-600",
  joined: "bg-indigo-50 text-indigo-600",
  activated: "bg-emerald-50 text-emerald-600",
  contrib: "bg-emerald-50 text-emerald-600",
  payout: "bg-amber-50 text-amber-600",
  default: "bg-red-50 text-red-600",
  rep: "bg-violet-50 text-violet-600",
  invite: "bg-indigo-50 text-indigo-600",
  reg: "bg-indigo-50 text-indigo-600",
  other: "bg-gray-100 text-gray-500",
};

export function LiveEventFeed({ compact = false }: { compact?: boolean }) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancel: (() => void) | undefined;
    (async () => {
      const initial = await fetchEvents();
      setEvents(initial);
      setLoading(false);
      cancel = startEventPolling(setEvents, 15_000);
    })();
    return () => cancel?.();
  }, []);

  const INITIAL_COUNT = compact ? 6 : 20;
  const shown = showAll ? events : events.slice(0, INITIAL_COUNT);
  const hasMore = events.length > INITIAL_COUNT;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Activity
        </h2>
        <span className="text-xs text-gray-400">polls every 5s</span>
      </div>

      {loading ? (
        <FullSpinner label="Fetching on-chain events…" />
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No events yet. Create or contribute to a circle to see live activity.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {shown.map((e) => {
            const Icon = KIND_ICON[e.kind] ?? Activity;
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-50"
              >
                <span
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    KIND_COLOR[e.kind]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{e.text}</p>
                  <p className="text-xs text-gray-400">
                    Ledger #{e.ledger.toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
        >
          {showAll
            ? "Show less"
            : `Show all ${events.length} events`}
        </button>
      )}
    </section>
  );
}
