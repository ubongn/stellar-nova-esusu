/**
 * Shared TypeScript types mirroring the Soroban contract data structures.
 */

export type CircleState = "Pending" | "Active" | "Completed" | "Closed";

export interface CircleConfig {
  size: number;
  contribution_amount: string; // i128 comes back as a string
  cycle_count: number;
  is_random_order: boolean;
  creator: string;
  name: string;
}

export interface CircleInfo {
  config: CircleConfig;
  state: CircleState;
  members: string[];
  current_round: number;
  payout_order: string[];
  total_contributions: string;
  pool_balance: string;
}

export interface Reputation {
  score: number;
  circles_joined: number;
  circles_completed: number;
  defaults: number;
  in_good_standing: boolean;
}

export interface Contribution {
  member: string;
  amount: string;
  round: number;
  circle_id: number;
}

/** Classified error categories surfaced to the UI. */
export type ErrorCategory =
  | "wallet_not_found"
  | "connection_rejected"
  | "insufficient_balance"
  | "network"
  | "contract"
  | "unknown";

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
}

/** Transaction lifecycle for the contribute flow. */
export type TxStatus =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "pending"
  | "confirmed"
  | "failed";

/** A normalized on-chain event for the live feed. */
export interface FeedEvent {
  id: string;
  topic: string;
  ledger: number;
  createdAt: number;
  text: string;
  kind: "created" | "contrib" | "payout" | "default" | "joined" | "activated" | "rep" | "invite" | "reg" | "closed" | "other";
}

export interface Toast {
  id: string;
  type: "success" | "info" | "error";
  title: string;
  message?: string;
}
