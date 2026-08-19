import { rpc, xdr, scValToNative } from "@stellar/stellar-sdk";
import { SAVINGS_POOL_CONTRACT_ID } from "./config";
import { getServer } from "./contract";
import { formatXlm, shortAddr } from "./utils";
import type { FeedEvent } from "./types";

const PAGE_LIMIT = 50;

function decodeScVal(base64: string): unknown {
  try {
    const scv = xdr.ScVal.fromXDR(base64, "base64");
    return scValToNative(scv);
  } catch {
    return null;
  }
}

function toStr(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "string") return v;
  return "";
}

function mapEvent(raw: rpc.Api.EventFilter): FeedEvent | null {
  const topicVals = (raw.topic ?? []).map((t) => {
    // topic entries are base64 XDR strings
    const v = typeof t === "string" ? decodeScVal(t) : null;
    return v;
  });
  const valueRaw = raw.value?.xdr ?? raw.value ?? "";
  const valueDecoded =
    typeof valueRaw === "string" ? decodeScVal(valueRaw) : valueRaw;

  const topicName = toStr(topicVals[0] ?? "");
  const ledger = raw.ledger ?? 0;
  const id: string = raw.id ?? `${ledger}-${topicName}-${Math.random()}`;

  let text = "";
  let kind: FeedEvent["kind"] = "other";

  switch (topicName) {
    case "Created": {
      kind = "created";
      // data: (creator: Address, size: u32)
      const d = Array.isArray(valueDecoded) ? valueDecoded : [];
      const creator = toStr(d[0]);
      const size = Number(d[1] ?? 0);
      text = `${shortAddr(creator || "?")} created a circle of ${size} members`;
      break;
    }
    case "Joined": {
      kind = "joined";
      const member = toStr(valueDecoded);
      text = `${shortAddr(member)} joined circle #${topicVals[1] ?? ""}`;
      break;
    }
    case "Activated": {
      kind = "activated";
      text = `Circle filled up and is now active`;
      break;
    }
    case "Contrib": {
      kind = "contrib";
      const d = Array.isArray(valueDecoded) ? valueDecoded : [];
      const member = toStr(d[0]);
      const amount = d[1];
      const round = Number(d[2] ?? "");
      text = `${shortAddr(member)} contributed ${formatXlm(amount)} XLM${
        round ? ` (round ${round})` : ""
      }`;
      break;
    }
    case "Payout": {
      kind = "payout";
      const d = Array.isArray(valueDecoded) ? valueDecoded : [];
      const recipient = toStr(d[0]);
      const amount = d[1];
      text = `Round payout of ${formatXlm(amount)} XLM sent to ${shortAddr(
        recipient
      )}`;
      break;
    }
    case "Default": {
      kind = "default";
      const member = toStr(valueDecoded);
      text = `${shortAddr(member)} was flagged as defaulting`;
      break;
    }
    case "Closed": {
      kind = "closed";
      const creator = toStr(valueDecoded);
      text = `${shortAddr(creator)} closed circle #${topicVals[1] ?? ""}`;
      break;
    }
    case "Rep": {
      kind = "rep";
      const d = Array.isArray(valueDecoded) ? valueDecoded : [];
      const delta = Number(d[0] ?? 0);
      const score = Number(d[1] ?? 0);
      text = `Reputation ${delta >= 0 ? "+" : ""}${delta} → ${score}`;
      break;
    }
    default:
      text = `${topicName || "Event"} occurred`;
  }

  return {
    id,
    topic: topicName,
    ledger,
    createdAt: Date.now(),
    text,
    kind,
  };
}

/** Fetch the most recent events for the SavingsPool contract. */
export async function fetchEvents(): Promise<FeedEvent[]> {
  const server = getServer();
  try {
    const resp = await server.getEvents({
      filters: [
        {
          type: "contract",
          contractIds: [SAVINGS_POOL_CONTRACT_ID],
        },
      ],
      startLedger: 0,
      cursor: undefined,
      limit: PAGE_LIMIT,
    });

    const events = (resp.events ?? [])
      .map((e) => mapEvent(e as unknown as rpc.Api.EventFilter))
      .filter((e): e is FeedEvent => e !== null)
      // Deduplicate by id.
      .filter(
        (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i
      )
      // Newest first: the RPC returns the page in ascending cursor order.
      // Ledger desc is primary; the Soroban cursor id (fixed-width) breaks ties
      // within the same ledger.
      .sort((a, b) => {
        if (b.ledger !== a.ledger) return b.ledger - a.ledger;
        return String(b.id).localeCompare(String(a.id));
      });

    if (events.length > 0) return events;
  } catch {
    // fall through to state-based fallback
  }

  // Fallback: derive feed events from on-chain circle state.
  return fetchEventsFromState();
}

/**
 * Build a synthetic event feed from the contract state.
 * This covers the common case where the Soroban event history API returns
 * nothing on testnet (retention window exceeded, archive gaps, etc.).
 */
async function fetchEventsFromState(): Promise<FeedEvent[]> {
  try {
    const { getAllCircles } = await import("./contract");
    const circles = await getAllCircles();
    const events: FeedEvent[] = [];

    for (let i = 0; i < circles.length; i++) {
      const c = circles[i];
      const circleId = i + 1;
      const creator = c.config.creator;
      const size = c.config.size;
      const memberCount = c.members.length;

      // 1. Created event
      events.push({
        id: `created-${circleId}`,
        topic: "Created",
        ledger: 0,
        createdAt: Date.now() - (circles.length - i) * 60_000,
        text: `${shortAddr(creator)} created "${c.config.name}" (${size} members, ${formatXlm(c.config.contribution_amount)} XLM)`,
        kind: "created",
      });

      // 2. Joined events for each member after the creator
      for (let m = 1; m < memberCount; m++) {
        events.push({
          id: `joined-${circleId}-${m}`,
          topic: "Joined",
          ledger: 0,
          createdAt: Date.now() - (circles.length - i) * 60_000 + m * 10_000,
          text: `${shortAddr(c.members[m])} joined "${c.config.name}"`,
          kind: "joined",
        });
      }

      // 3. Activated event if circle is now Active
      if (c.state === "Active") {
        events.push({
          id: `activated-${circleId}`,
          topic: "Activated",
          ledger: 0,
          createdAt: Date.now() - (circles.length - i) * 60_000 + memberCount * 10_000,
          text: `"${c.config.name}" is now active — all ${size} spots filled`,
          kind: "activated",
        });
      }

      // 4. Closed event
      if (c.state === "Closed") {
        events.push({
          id: `closed-${circleId}`,
          topic: "Closed",
          ledger: 0,
          createdAt: Date.now(),
          text: `${shortAddr(creator)} closed "${c.config.name}"`,
          kind: "closed",
        });
      }
    }

    // Sort newest first
    events.sort((a, b) => b.createdAt - a.createdAt);
    return events;
  } catch {
    return [];
  }
}

/** Start polling for events. Returns a cancel function. */
export function startEventPolling(
  onEvents: (events: FeedEvent[]) => void,
  intervalMs = 5000
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const tick = async () => {
    if (cancelled) return;
    const events = await fetchEvents();
    if (!cancelled) onEvents(events);
    if (!cancelled) {
      timer = setTimeout(tick, intervalMs);
    }
  };

  tick();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
