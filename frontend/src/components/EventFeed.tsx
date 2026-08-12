import type { CircleEvent } from "../lib/types";
import { useEvents } from "../hooks/useEvents";
import { shortAddr } from "../lib/utils";
import { ActivityIcon, UsersIcon, CoinsIcon, CheckIcon, StarIcon, SpinnerIcon } from "./Icons";

function pickIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("creat")) return UsersIcon;
  if (t.includes("join")) return UsersIcon;
  if (t.includes("contrib")) return CoinsIcon;
  if (t.includes("pay")) return CheckIcon;
  if (t.includes("default")) return StarIcon;
  return ActivityIcon;
}

function describe(e: CircleEvent): string {
  const payload = e.payload as { topic?: string[]; value?: unknown };
  const val = payload.value;
  let detail = "";
  try {
    const v = typeof val === "string" ? JSON.parse(val) : val;
    if (Array.isArray(v)) {
      const addrs = v
        .map((x) => (x && typeof x === "object" && "address" in x ? shortAddr(x.address) : null))
        .filter(Boolean);
      if (addrs.length) detail = addrs.join(", ");
    } else if (v && typeof v === "object" && "address" in v) {
      detail = shortAddr((v as { address: string }).address);
    }
  } catch {
    /* ignore */
  }
  const label = e.type || "Event";
  return detail ? `${label} — ${detail}` : label;
}

/** Live event feed polled from the Soroban RPC. */
export function EventFeed({ limit = 20 }: { limit?: number }) {
  const { events, loading, error } = useEvents(limit);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <ActivityIcon className="h-4 w-4 text-brand-500" />
          Live activity
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Polling every 5s
        </span>
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="mt-4 text-sm text-gray-400">Unable to load activity right now.</p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">No on-chain activity yet.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto pr-1">
          {events.map((e) => {
            const Icon = pickIcon(e.type);
            return (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-gray-50"
              >
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{describe(e)}</p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(e.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {loading && (
        <p className="sr-only">
          <SpinnerIcon /> Loading events
        </p>
      )}
    </div>
  );
}
