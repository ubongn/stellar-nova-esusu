import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Users,
  Coins,
  Repeat,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { cx } from "@/lib/utils";

const STORAGE_KEY = "nova-onboarding-dismissed";

/** Re-open the tour programmatically (e.g. from the header Guide button). */
export function openOnboarding() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("nova:open-onboarding"));
}

const STEPS = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    body: "Use Freighter (desktop) with a Stellar testnet account. New to testnet? Top up free XLM from the friendbot — no real funds involved.",
    accent: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    icon: Users,
    title: "Join a savings circle",
    body: "Browse open circles on the Join page, or create your own. The last person to join activates the whole circle — one click.",
    accent: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    icon: Coins,
    title: "Contribute each round",
    body: "Every member contributes the round amount into the escrow pool held by the smart contract. You can see the pool balance on-chain at all times.",
    accent: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    icon: Repeat,
    title: "Get paid — and pay it forward",
    body: "Each round, one member receives the whole pot. The payout order is locked at activation (random or sequential) and can never be changed — not even by us.",
    accent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
];

export function OnboardingTour() {
  const { address, connect, connecting } = useWallet();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setOpen(true);
    const handler = () => setOpen(true);
    window.addEventListener("nova:open-onboarding", handler);
    return () => window.removeEventListener("nova:open-onboarding", handler);
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  // Deep-link friendbot straight to the connected wallet — one click funds it,
  // no address form to paste into (raw 400s from friendbot confused testers).
  const friendbotUrl = address
    ? `https://friendbot.stellar.org/?addr=${address}`
    : "https://friendbot.stellar.org";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Nova Esusu"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header band */}
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 pb-6 pt-7 text-white">
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close guide"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-200">
            Nova Esusu
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">
            Rotating savings, on Stellar
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-100">
            Trusted savings circles (esusu) rebuilt as a Soroban smart contract:
            everyone contributes, one member gets the pot each round, nobody can
            change the rules. Here's how it works in 4 steps.
          </p>
        </div>

        {/* Steps */}
        <div className="max-h-[45vh] space-y-4 overflow-y-auto px-6 py-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div
                className={cx(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  step.accent
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  <span className="mr-1.5 text-gray-400 dark:text-gray-500">
                    {i + 1}.
                  </span>
                  {step.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-5 dark:border-gray-800">
          {address ? (
            <Link
              to="/join"
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Browse open circles <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => connect().catch(() => undefined)}
              disabled={connecting}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting…" : "Connect Freighter wallet"}
            </button>
          )}
          <div className="flex items-center justify-between">
            <a
              href={friendbotUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-300"
            >
              {address
                ? "Fund this wallet — free testnet XLM"
                : "Get free testnet XLM"}{" "}
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={close}
              className="text-xs font-medium text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
