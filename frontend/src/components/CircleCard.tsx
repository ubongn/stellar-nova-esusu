import { Link } from "react-router-dom";
import { ArrowRight, Crown, Users } from "lucide-react";
import type { CircleInfo } from "@/lib/types";
import {
  cx,
  formatXlm,
  progressPercent,
  shortAddr,
} from "@/lib/utils";

const STATE_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-gray-100 text-gray-600 border-gray-200",
};

export function CircleCard({
  circle,
  circleId,
  self,
}: {
  circle: CircleInfo;
  circleId: number;
  self?: string | null;
}) {
  const { config, state, members, current_round, pool_balance } = circle;
  const progress = progressPercent(current_round, config.cycle_count);
  const yourPosition = self ? members.indexOf(self) : -1;
  const nextPayout =
    state === "Active" && circle.payout_order.length > 0
      ? circle.payout_order[current_round - 1] ?? circle.payout_order[0]
      : members[0];

  return (
    <Link
      to={`/circle/${circleId}`}
      className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{config.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {members.length}/{config.size} members
          </p>
        </div>
        <span
          className={cx(
            "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            STATE_STYLES[state] ?? STATE_STYLES.Pending
          )}
        >
          {state}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Round {Math.min(current_round, config.cycle_count)}/
            {config.cycle_count}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Contribution</p>
          <p className="font-semibold text-gray-900">
            {formatXlm(config.contribution_amount)} XLM
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Pot</p>
          <p className="font-semibold text-gray-900">
            {formatXlm(pool_balance)} XLM
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {nextPayout && (
            <>
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              Next payout: {nextPayout === self ? "You" : shortAddr(nextPayout)}
            </>
          )}
          {yourPosition >= 0 && (
            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
              You&apos;re #{yourPosition + 1}
            </span>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
    </Link>
  );
}
