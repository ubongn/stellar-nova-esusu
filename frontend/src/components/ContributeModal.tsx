import { useEffect, useState } from "react";
import { X, Check, Loader2, ArrowUpCircle } from "lucide-react";
import type { CircleInfo, TxStatus } from "@/lib/types";
import { contribute } from "@/lib/contract";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import { classifyError } from "@/lib/wallet";
import { cx, formatXlm, stroopsToNumber, xlmToStroops } from "@/lib/utils";
import { Spinner } from "./Spinner";

const QUICK = [5, 10, 25, 50];

const STEPS: { key: TxStatus; label: string }[] = [
  { key: "preparing", label: "Preparing" },
  { key: "signing", label: "Signing" },
  { key: "submitting", label: "Submitting" },
  { key: "pending", label: "Pending" },
];

function stepIndex(status: TxStatus): number {
  if (status === "confirmed") return STEPS.length;
  if (status === "failed") return STEPS.length;
  return STEPS.findIndex((s) => s.key === status);
}

export function ContributeModal({
  circle,
  circleId,
  onClose,
  onDone,
}: {
  circle: CircleInfo;
  circleId: number;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { address } = useWallet();
  const { push } = useToast();
  const required = stroopsToNumber(circle.config.contribution_amount);
  const [amount, setAmount] = useState<string>(String(required));
  const [status, setStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-close shortly after on-chain confirmation so the success state is
  // seen, then the user is returned to the refreshed circle view.
  useEffect(() => {
    if (status !== "confirmed") return;
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [status, onClose]);

  // Busy during processing; locked after success; only failure re-enables for retry.
  const disabled = status !== "idle" && status !== "failed";
  const activeStep = stepIndex(status);

  async function handleContribute() {
    if (!address) return;
    const stroops = xlmToStroops(amount);
    if (stroops <= 0n) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    setErrorMsg("");
    setStatus("preparing");
    try {
      const hash = await contribute(address, circleId, stroops, {
        onStatus: (s) => setStatus(s as TxStatus),
      });
      setStatus("confirmed");
      push({
        type: "success",
        title: "Contribution confirmed",
        message: `${formatXlm(stroops)} XLM escrowed`,
      });
      onDone?.();
      void hash;
    } catch (err) {
      setStatus("failed");
      const c = classifyError(err);
      setErrorMsg(c.message);
      push({ type: "error", title: "Contribution failed", message: c.message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Contribute to {circle.config.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          Required this round:{" "}
          <span className="font-semibold">{formatXlm(circle.config.contribution_amount)} XLM</span>
        </div>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Amount (XLM)
        </label>
        <input
          type="number"
          min={0}
          step="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-lg font-semibold text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              disabled={disabled}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              {q} XLM
            </button>
          ))}
        </div>

        {status !== "idle" && (
          <div className="mt-4 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
            {STEPS.map((step, i) => {
              const done = i < activeStep || status === "confirmed";
              const current = i === activeStep && status !== "confirmed";
              return (
                <div key={step.key} className="flex items-center gap-2 text-sm">
                  <span
                    className={cx(
                      "flex h-5 w-5 items-center justify-center rounded-full text-white",
                      done
                        ? "bg-emerald-500"
                        : current
                        ? "bg-brand-500"
                        : "bg-gray-300"
                    )}
                  >
                    {done ? (
                      <Check className="h-3 w-3" />
                    ) : current ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="text-[10px]">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={cx(
                      done || current ? "font-medium text-gray-800" : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
            {status === "confirmed" && (
              <p className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-emerald-600">
                <Check className="h-4 w-4" /> Transaction confirmed on-chain
              </p>
            )}
            {status === "failed" && (
              <p className="pt-1 text-sm font-medium text-red-600">{errorMsg}</p>
            )}
          </div>
        )}

        <button
          onClick={handleContribute}
          disabled={disabled || !address}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
        >
          {disabled ? (
            <>
              <Spinner /> Processing…
            </>
          ) : (
            <>
              <ArrowUpCircle className="h-4 w-4" />
              {address ? `Contribute ${amount} XLM` : "Connect wallet first"}
            </>
          )}
        </button>
        {!address && (
          <p className="mt-2 text-center text-xs text-gray-400">
            Connect your wallet to contribute.
          </p>
        )}
      </div>
    </div>
  );
}
