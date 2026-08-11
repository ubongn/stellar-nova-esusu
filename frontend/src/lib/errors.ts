// Classify raw errors from the wallet/contract/network into UI categories.
import type { ClassifiedError, ErrorCategory } from "./types";

const PATTERNS: Array<{ test: RegExp; category: ErrorCategory; message: string }> = [
  {
    test: /not found|not installed|freighter|xbull|albedo/i,
    category: "wallet_not_found",
    message: "Wallet not found. Please install the wallet extension.",
  },
  {
    test: /reject|denied|cancel|user declined/i,
    category: "connection_rejected",
    message: "Request was rejected in the wallet.",
  },
  {
    test: /insufficient|underfunded|balance too low|not enough/i,
    category: "insufficient_balance",
    message: "Insufficient balance to complete this transaction.",
  },
  {
    test: /network|fetch|timeout|ECONNREFUSED|503|502|RPC/i,
    category: "network_error",
    message: "Network error. Check your connection and try again.",
  },
  {
    test: /contract|soroban|host function|auth|panic|assert/i,
    category: "contract_error",
    message: "The contract rejected the operation.",
  },
];

export function classifyError(err: unknown): ClassifiedError {
  const detail = err instanceof Error ? err.message : String(err);
  for (const p of PATTERNS) {
    if (p.test.test(detail)) {
      return { category: p.category, message: p.message, detail };
    }
  }
  return { category: "contract_error", message: "Something went wrong.", detail };
}
