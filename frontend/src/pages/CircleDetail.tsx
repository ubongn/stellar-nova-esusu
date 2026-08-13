import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Crown,
  Users,
  Zap,
  CheckCircle2,
  Circle,
  UserPlus,
  Loader2,
} from "lucide-react";
import { ContributeModal } from "@/components/ContributeModal";
import { LiveEventFeed } from "@/components/LiveEventFeed";
import { Button } from "@/components/ui/Button";
import { FullSpinner } from "@/components/Spinner";
import { getCircleState, joinCircle, closeCircle } from "@/lib/contract";
import { processPayout } from "@/lib/contract";
import type { CircleInfo } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/context/ToastContext";
import { classifyError } from "@/lib/wallet";
import {
  cx,
  formatXlm,
  progressPercent,
  shortAddr,
} from "@/lib/utils";

export function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);
  const { address } = useWallet();
  const { push } = useToast();
  const [circle, setCircle] = useState<CircleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContribute, setShowContribute] = useState(false);
  const [paying, setPaying] = useState(false);
  const [joining, setJoining] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCircleState(circleId);
      setCircle(data);
    } catch {
      setCircle(null);
    } finally {
      setLoading(false);
    }
  }, [circleId]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <FullSpinner label="Loading circle…" />;
  if (!circle)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-500">This circle could not be found.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-brand-600"
        >
          ← Back to dashboard
        </Link>
      </div>
    );

  const { config, state, members, current_round, payout_order, pool_balance } =
    circle;
  const progress = progressPercent(current_round, config.cycle_count);
  const isMember = address ? members.includes(address) : false;
  const isCreator = address ? config.creator === address : false;
  const yourPosition = address ? members.indexOf(address) : -1;
  const canPayout = state === "Active";

  async function handlePayout() {
    if (!address) return;
    setPaying(true);
    try {
      await processPayout(address, circleId);
      push({ type: "success", title: "Payout processed" });
      await load();
    } catch (err) {
      const c = classifyError(err);
      push({ type: "error", title: "Payout failed", message: c.message });
    } finally {
      setPaying(false);
    }
  }

  async function handleJoin() {
    if (!address) return;
    setJoining(true);
    try {
      await joinCircle(address, circleId, {
        onStatus: (s) => {
          if (s === "done") {
            push({ type: "success", title: "Joined!", message: `Welcome to ${config.name}` });
          }
        },
      });
      await load();
    } catch (err) {
      const c = classifyError(err instanceof Error ? err.cause ?? err : err);
      push({ type: "error", title: "Failed to join", message: c.message });
    } finally {
      setJoining(false);
    }
  }

  async function handleClose() {
    if (!address) return;
    setClosing(true);
    try {
      await closeCircle(address, circleId, {
        onStatus: (s) => {
          if (s === "done") {
            push({ type: "success", title: "Circle closed" });
          }
        },
      });
      await load();
    } catch (err) {
      const c = classifyError(err instanceof Error ? err.cause ?? err : err);
      push({ type: "error", title: "Failed to close", message: c.message });
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      {/* Header card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {config.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {members.length}/{config.size} members
              </span>
              <span>•</span>
              <span>
                Round {Math.min(current_round, config.cycle_count)}/
                {config.cycle_count}
              </span>
              <span>•</span>
              <span>{config.is_random_order ? "Random order" : "Sequential"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Join button: not a member, circle pending, has space */}
            {!isMember && state === "Pending" && members.length < config.size && (
              address ? (
                <Button onClick={handleJoin} loading={joining}>
                  <UserPlus className="h-4 w-4" /> Join Circle
                </Button>
              ) : (
                <span className="text-sm text-amber-600">Connect wallet to join</span>
              )
            )}
            {/* Contribute button: member + circle active */}
            {isMember && state === "Active" && (
              <button
                onClick={() => setShowContribute(true)}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
              >
                <Zap className="h-4 w-4" /> Contribute
              </button>
            )}
            {/* Waiting for members */}
            {isMember && state === "Pending" && (
              <span className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for {config.size - members.length} more member{config.size - members.length !== 1 ? "s" : ""}
              </span>
            )}
            {/* Close button: creator only, pending, no contributions */}
            {isCreator && state === "Pending" && Number(pool_balance) === 0 && (
              <button
                onClick={handleClose}
                disabled={closing}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Close Circle
              </button>
            )}
            {/* Closed badge */}
            {state === "Closed" && (
              <span className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500">
                Circle closed
              </span>
            )}
            {canPayout && (
              <Button onClick={handlePayout} loading={paying} variant="secondary">
                <Banknote className="h-4 w-4" /> Process Payout
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Contribution", value: `${formatXlm(config.contribution_amount)} XLM` },
            { label: "Pot", value: `${formatXlm(pool_balance)} XLM` },
            { label: "Total saved", value: `${formatXlm(circle.total_contributions)} XLM` },
            { label: "Status", value: state },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Members & payout schedule */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-gray-900">Payout Schedule</h2>
            <ol className="mt-3 space-y-2">
              {(payout_order.length ? payout_order : members).map(
                (addr, i) => {
                  const isCurrent =
                    state === "Active" && i === current_round - 1;
                  const isDone = state === "Active" && i < current_round - 1;
                  return (
                    <li
                      key={`${addr}-${i}`}
                      className={cx(
                        "flex items-center justify-between rounded-xl border px-3 py-2.5",
                        isCurrent
                          ? "border-brand-300 bg-brand-50"
                          : "border-gray-100"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isCurrent ? (
                          <Crown className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                        <span className="text-sm font-medium text-gray-800">
                          Round {i + 1}
                        </span>
                      </span>
                      <span className="font-mono text-sm text-gray-600">
                        {addr === address ? "You" : shortAddr(addr)}
                      </span>
                    </li>
                  );
                }
              )}
              {members.length === 0 && (
                <li className="py-4 text-center text-sm text-gray-400">
                  No members yet.
                </li>
              )}
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-gray-900">Members</h2>
            <ul className="mt-3 divide-y divide-gray-100">
              {members.map((addr, i) => (
                <li
                  key={addr}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="font-mono text-gray-700">
                      {shortAddr(addr, 5, 5)}
                    </span>
                  </span>
                  {addr === address && (
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      You
                    </span>
                  )}
                  {addr === config.creator && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Creator
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {yourPosition >= 0 && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                You are member #{yourPosition + 1}.
              </p>
            )}
          </section>
        </div>

        <aside>
          <LiveEventFeed />
        </aside>
      </div>

      {showContribute && circle && (
        <ContributeModal
          circle={circle}
          circleId={circleId}
          onClose={() => setShowContribute(false)}
          onDone={load}
        />
      )}
    </div>
  );
}
