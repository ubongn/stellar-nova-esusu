import { AlertTriangle, X } from "lucide-react";
import type { ClassifiedError } from "@/lib/types";
import { cx } from "@/lib/utils";

const COPY: Record<string, { title: string }> = {
  wallet_not_found: { title: "Wallet not found" },
  connection_rejected: { title: "Connection rejected" },
  insufficient_balance: { title: "Insufficient balance" },
  network: { title: "Network error" },
  contract: { title: "Contract error" },
  unknown: { title: "Something went wrong" },
};

export function ErrorBanner({
  error,
  onDismiss,
}: {
  error: ClassifiedError | null;
  onDismiss?: () => void;
}) {
  if (!error) return null;
  const meta = COPY[error.category] ?? COPY.unknown;
  return (
    <div
      role="alert"
      className={cx(
        "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-300 shadow-card",
        "animate-[fadeIn_0.2s_ease-out]"
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex-1">
        <p className="font-semibold">{meta.title}</p>
        <p className="text-red-700 dark:text-red-300">{error.message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 text-red-400 transition hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
