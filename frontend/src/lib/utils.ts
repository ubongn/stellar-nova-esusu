import { STROOPS_PER_XLM } from "./config";

/**
 * Convert stroops (i128 string) to a human-readable XLM amount.
 * @param stroops value in stroops, as a number, string, or bigint
 * @param decimals number of decimal places to display
 */
export function formatXlm(
  stroops: string | number | bigint,
  decimals = 2
): string {
  const big = BigInt(stroops);
  const negative = big < 0n;
  const abs = negative ? -big : big;
  const whole = abs / BigInt(STROOPS_PER_XLM);
  const frac = abs % BigInt(STROOPS_PER_XLM);
  if (decimals === 0) return `${negative ? "-" : ""}${whole}`;
  const fracStr = frac.toString().padStart(7, "0").slice(0, decimals);
  const trimmed = fracStr.replace(/0+$/, "");
  const body = trimmed.length > 0 ? `${whole}.${trimmed}` : `${whole}`;
  return `${negative ? "-" : ""}${body}`;
}

/**
 * Shorten a Stellar address / contract id for display: `GABC...XYZ`.
 * Handles both G... (accounts) and C... (contracts).
 */
export function shortAddr(address: string, head = 4, tail = 4): string {
  if (!address || address.length <= head + tail) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * Total payout a member receives per round (the full pot).
 * = contribution_amount × number_of_members.
 */
export function calculatePayout(
  contributionAmount: string | number | bigint,
  memberCount: number
): bigint {
  if (memberCount <= 0) return 0n;
  return BigInt(contributionAmount) * BigInt(memberCount);
}

/**
 * A qualitative label derived from a numeric reputation score.
 */
export function formatReputation(score: number): {
  label: string;
  color: string;
  stars: number;
} {
  const stars = Math.max(0, Math.min(5, Math.round(score / 20)));
  let label = "New";
  let color = "text-gray-500";
  if (score >= 90) {
    label = "Excellent";
    color = "text-emerald-600";
  } else if (score >= 70) {
    label = "Good";
    color = "text-brand-600";
  } else if (score >= 50) {
    label = "Fair";
    color = "text-amber-600";
  } else if (score >= 40) {
    label = "At Risk";
    color = "text-orange-600";
  } else {
    label = "Poor";
    color = "text-red-600";
  }
  return { label, color, stars };
}

/**
 * Human-readable "time until" the next round.
 * In a real deployment round timing is ledger-bound; here we estimate from a
 * per-round interval (default 7 days) and a start timestamp.
 */
export function timeUntilNextRound(
  now: number,
  roundStart: number,
  roundDurationMs = 7 * 24 * 60 * 60 * 1000
): string {
  const next = roundStart + roundDurationMs;
  const diff = next - now;
  if (diff <= 0) return "Now";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Percentage of rounds completed, 0–100. */
export function progressPercent(currentRound: number, cycleCount: number): number {
  if (cycleCount <= 0) return 0;
  return Math.min(100, Math.round(((currentRound - 1) / cycleCount) * 100));
}

/** Parse a user-entered XLM amount into stroops (bigint). */
export function xlmToStroops(xlm: string | number): bigint {
  const n = Number(xlm);
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * STROOPS_PER_XLM));
}

/** Parse stroops string → number for arithmetic (use bigint for large values). */
export function stroopsToNumber(stroops: string | number | bigint): number {
  return Number(BigInt(stroops)) / STROOPS_PER_XLM;
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
