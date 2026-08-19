import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Shuffle, ListOrdered } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import { createCircle, getCircleCount } from "@/lib/contract";
import { classifyError } from "@/lib/wallet";
import { Button } from "@/components/ui/Button";
import { cx } from "@/lib/utils";

export function CreateCircle() {
  const { address } = useWallet();
  const { push } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [size, setSize] = useState(5);
  const [amount, setAmount] = useState(10);
  const [cycleCount, setCycleCount] = useState(5);
  const [isRandom, setIsRandom] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Circle name is required.";
    if (name.trim().length < 3) return "Name must be at least 3 characters.";
    if (size < 2) return "Group must have at least 2 members.";
    if (size > 50) return "Maximum 50 members per circle.";
    if (amount < 1) return "Contribution must be at least 1 XLM.";
    if (amount > 10000) return "Maximum contribution is 10,000 XLM.";
    if (cycleCount < 1) return "At least 1 round required.";
    if (cycleCount > size) return "Rounds cannot exceed group size.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      setError("Connect your wallet first.");
      return;
    }
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setBusy(true);
    setStatus("Preparing transaction…");
    try {
      const before = await getCircleCount();
      await createCircle(
        address,
        name.trim(),
        size,
        BigInt(Math.round(amount * 10_000_000)),
        cycleCount,
        isRandom,
        {
          onStatus: (s) => {
            const labels: Record<string, string> = {
              preparing: "Preparing transaction…",
              signing: "Waiting for wallet signature…",
              submitting: "Submitting to network…",
              pending: "Confirming on-chain…",
              done: "Confirmed!",
            };
            setStatus(labels[s] ?? s);
          },
        }
      );
      setStatus("Confirmed!");
      push({ type: "success", title: "Circle created!", message: name.trim() });
      // Navigate to the new circle
      const after = await getCircleCount();
      const newId = after > before ? after : undefined;
      setTimeout(() => {
        if (newId) navigate(`/circle/${newId}`);
        else navigate("/");
      }, 800);
    } catch (err) {
      const classified = classifyError(err instanceof Error ? err.cause ?? err : err);
      setError(classified.message);
      setStatus(null);
      push({ type: "error", title: "Failed to create circle", message: classified.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Create a Savings Circle</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set up a new rotating savings circle on Stellar testnet.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {status && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 text-sm text-brand-800 dark:text-brand-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Circle Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lagos Builders"
              className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/40"
              disabled={busy}
            />
          </div>

          {/* Size & Cycles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="size" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Group Size
              </label>
              <input
                id="size"
                type="number"
                min={2}
                max={50}
                value={size}
                onChange={(e) => setSize(e.target.value === "" ? 2 : Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/40"
                disabled={busy}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">2–50 members</p>
            </div>
            <div>
              <label htmlFor="cycles" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Rounds (Cycles)
              </label>
              <input
                id="cycles"
                type="number"
                min={1}
                max={size}
                value={cycleCount}
                onChange={(e) => setCycleCount(e.target.value === "" ? 1 : Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/40"
                disabled={busy}
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">How many payout rounds</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Contribution per Round (XLM)
            </label>
            <input
              id="amount"
              type="number"
              min={1}
              max={10000}
              step={0.1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? 1 : Number(e.target.value))}
              className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-500/40"
              disabled={busy}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Each member contributes this amount every round
            </p>
          </div>

          {/* Payout order */}
          <div>
            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Payout Order</span>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsRandom(false)}
                className={cx(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                  !isRandom
                    ? "border-brand-300 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
                disabled={busy}
              >
                <ListOrdered className="h-4 w-4" /> Join Order
              </button>
              <button
                type="button"
                onClick={() => setIsRandom(true)}
                className={cx(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                  isRandom
                    ? "border-brand-300 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
                disabled={busy}
              >
                <Shuffle className="h-4 w-4" /> Random
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 text-sm text-gray-600 dark:text-gray-300">
            <p className="font-semibold text-gray-800 dark:text-gray-100">Summary</p>
            <p className="mt-1">
              <strong>{name || "—"}</strong> · {size} members · {cycleCount} rounds ·{" "}
              <strong>{amount} XLM</strong> per round
            </p>
            <p className="mt-1">
              Total pool per round: <strong>{(size * amount).toLocaleString()} XLM</strong> ·
              Payout order: {isRandom ? "Random" : "Join order"}
            </p>
          </div>

          {/* Submit */}
          {!address ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 p-4 text-center text-sm text-amber-700 dark:text-amber-300">
              Connect your wallet to create a circle.
            </div>
          ) : (
            <Button
              type="submit"
              loading={busy}
              className="w-full"
              size="lg"
            >
              {busy ? status : "Create Circle"}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
