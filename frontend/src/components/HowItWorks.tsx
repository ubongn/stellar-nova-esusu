import { Wallet, Users, Coins, Repeat } from "lucide-react";
import { openOnboarding } from "./OnboardingTour";
import { cx } from "@/lib/utils";

const STEPS = [
  {
    icon: Wallet,
    title: "Connect",
    body: "Freighter wallet, testnet — free XLM from the friendbot.",
  },
  {
    icon: Users,
    title: "Join a circle",
    body: "Pick an open circle. The last joiner activates it instantly.",
  },
  {
    icon: Coins,
    title: "Contribute",
    body: "Each round, every member pays into the on-chain escrow pool.",
  },
  {
    icon: Repeat,
    title: "Rotate payouts",
    body: "One member takes the pot each round — order locked at activation.",
  },
];

/** Permanent, always-visible plain-English explainer for first-time visitors. */
export function HowItWorks() {
  return (
    <section className="mt-10" aria-label="How Nova Esusu works">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          How it works
        </h2>
        <button
          onClick={openOnboarding}
          className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
        >
          New here? Take the 60-second guide →
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                <step.icon className="h-5 w-5" />
              </div>
              <span
                className={cx(
                  "text-4xl font-black leading-none",
                  "text-gray-100 dark:text-gray-800"
                )}
              >
                {i + 1}
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
              {step.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
        Trustless by design: the payout order is committed on-chain when the
        circle activates and cannot be changed afterwards — not even by the
        contract deployer. All activity is verifiable on{" "}
        <a
          href="https://stellar.expert/explorer/testnet/contract/CACYGZA4BTSU5EZZKFL5XFPS2SBRSRCMXPGIB54Q4LZDVOD4SF2WWSCI"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-700 dark:text-brand-300 dark:decoration-brand-500/50"
        >
          Stellar Expert
        </a>
        .
      </p>
    </section>
  );
}
