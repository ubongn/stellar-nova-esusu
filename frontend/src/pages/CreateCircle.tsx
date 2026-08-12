import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { createCircle, defaultHandlers } from "../lib/contract";
import { useToast } from "../components/ToastProvider";
import { classifyError } from "../lib/errors";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  ArrowLeftIcon,
  SpinnerIcon,
  CheckIcon,
  ShuffleIcon,
  ListIcon,
} from "../components/Icons";
import type { TxStage } from "../lib/types";
import { cn, validateAmount, validateName, validateSize } from "../lib/utils";

interface CreateCircleProps {
  onBack: () => void;
  onCreated: (id: number) => void;
}

const STAGES: { key: Exclude<TxStage, "idle" | "confirmed" | "failed">; label: string }[] = [
  { key: "preparing", label: "Preparing" },
  { key: "signing", label: "Signing" },
  { key: "submitting", label: "Submitting" },
  { key: "pending", label: "Confirming" },
];

export function CreateCircle({ onBack, onCreated }: CreateCircleProps) {
  const { address } = useWallet();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [size, setSize] = useState(5);
  const [amount, setAmount] = useState(10);
  const [cycleCount, setCycleCount] = useState(5);
  const [isRandom, setIsRandom] = useState(false);

  const [stage, setStage] = useState<TxStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const busy = ["preparing", "signing", "submitting", "pending"].includes(stage);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const nameRes = validateName(name);
    if (!nameRes.ok) errs.name = nameRes.error!;
    const sizeRes = validateSize(size);
    if (!sizeRes.ok) errs.size = sizeRes.error!;
    const amountRes = validateAmount(amount);
    if (!amountRes.ok) errs.amount = amountRes.error!;
    if (cycleCount < 1) errs.cycleCount = "At least 1 round.";
    if (cycleCount > size) errs.cycleCount = "Cycle count can't exceed group size.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      setError("Connect your wallet to create a circle.");
      return;
    }
    if (!validate()) return;
    setError(null);
    setStage("preparing");
    try {
      const result = await createCircle(
        {
          creator: address,
          name: name.trim(),
          size,
          contributionAmountStroops: BigInt(Math.round(amount * 10_000_000)),
          cycleCount,
          isRandomOrder: isRandom,
        },
        { ...defaultHandlers({ onStage: setStage }) }
      );
      setStage("confirmed");
      showToast(`Circle created! Tx ${result.hash.slice(0, 8)}…`, "success");
      // New circle id is the latest count; navigate back to dashboard which refreshes.
      setTimeout(() => onBack(), 900);
    } catch (err) {
      setStage("failed");
      setError(classifyError(err).message);
      showToast(classifyError(err).message, "error");
    }
  }

  const pot = (size * amount).toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <button onClick={onBack} className="btn-ghost -ml-2 text-sm">
        <ArrowLeftIcon className="h-4 w-4" /> Back to dashboard
      </button>

      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create a circle</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your rotating savings group. Once it fills, the contract
          activates and rotation begins.
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner error={classifyError(new Error(error))} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-6 p-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Circle name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family Savings"
            className="input mt-1.5"
            maxLength={64}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        {/* Size */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="size" className="text-sm font-medium text-gray-700">
              Group size
            </label>
            <span className="text-sm font-semibold text-brand-600">{size} members</span>
          </div>
          <input
            id="size"
            type="range"
            min={2}
            max={50}
            value={size}
            disabled={busy}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-1 flex justify-between text-[11px] text-gray-400">
            <span>2</span>
            <span>50</span>
          </div>
          {fieldErrors.size && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.size}</p>
          )}
        </div>

        {/* Contribution amount */}
        <div>
          <label htmlFor="amount" className="text-sm font-medium text-gray-700">
            Contribution per round (XLM)
          </label>
          <div className="relative mt-1.5">
            <input
              id="amount"
              type="number"
              min={0.0000001}
              step={0.1}
              value={amount}
              disabled={busy}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input pr-14"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
              XLM
            </span>
          </div>
          {fieldErrors.amount && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.amount}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-400">
            Round payout: <span className="font-semibold text-gray-600">{pot} XLM</span>{" "}
            ({size} × {amount})
          </p>
        </div>

        {/* Cycle count */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="cycles" className="text-sm font-medium text-gray-700">
              Number of rounds
            </label>
            <span className="text-sm font-semibold text-brand-600">{cycleCount}</span>
          </div>
          <input
            id="cycles"
            type="range"
            min={1}
            max={size}
            value={Math.min(cycleCount, size)}
            disabled={busy}
            onChange={(e) => setCycleCount(Number(e.target.value))}
            className="mt-2 w-full"
          />
          {fieldErrors.cycleCount && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.cycleCount}</p>
          )}
        </div>

        {/* Payout order */}
        <div>
          <span className="text-sm font-medium text-gray-700">Payout order</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setIsRandom(false)}
              className={cn(
                "rounded-lg border p-4 text-left transition",
                !isRandom
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <ListIcon className="h-5 w-5 text-gray-600" />
              <p className="mt-2 text-sm font-semibold text-gray-900">Join order</p>
              <p className="text-xs text-gray-500">First to join, first paid.</p>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setIsRandom(true)}
              className={cn(
                "rounded-lg border p-4 text-left transition",
                isRandom
                  ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <ShuffleIcon className="h-5 w-5 text-gray-600" />
              <p className="mt-2 text-sm font-semibold text-gray-900">Randomized</p>
              <p className="text-xs text-gray-500">Shuffled fairly on activation.</p>
            </button>
          </div>
        </div>

        {/* Status tracker */}
        {stage !== "idle" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              {STAGES.map((s, i) => {
                const active = stage === s.key;
                const done = stage === "confirmed";
                return (
                  <div key={s.key} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <div className="flex-1" />
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                          done
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : active
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-gray-300 bg-white text-gray-400"
                        )}
                      >
                        {done ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : active ? (
                          <SpinnerIcon className="h-4 w-4" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div
                        className={cn(
                          "flex-1",
                          i === STAGES.length - 1 ? "" : done || active ? "bg-brand-300 h-0.5" : "bg-gray-200 h-0.5"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] font-medium",
                        done || active ? "text-gray-700" : "text-gray-400"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {stage === "confirmed" && (
              <p className="mt-2 text-center text-xs font-medium text-emerald-600">
                Circle created on-chain! Returning to dashboard…
              </p>
            )}
          </div>
        )}

        <button type="submit" disabled={busy || !address} className="btn-primary w-full">
          {busy ? (
            <>
              <SpinnerIcon className="h-4 w-4" /> Creating…
            </>
          ) : stage === "confirmed" ? (
            <>
              <CheckIcon className="h-4 w-4" /> Created
            </>
          ) : (
            "Create circle"
          )}
        </button>
        {!address && (
          <p className="text-center text-xs text-gray-400">
            Connect your wallet to create a circle.
          </p>
        )}
      </form>
    </main>
  );
}
