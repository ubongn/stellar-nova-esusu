import { Shield, Users, Wallet } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { formatReputation, shortAddr, cx, formatXlm } from "@/lib/utils";
import { STROOPS_PER_XLM } from "@/lib/config";

function StatRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </span>
      <span className={cx("text-sm font-semibold text-gray-900", accent)}>
        {value}
      </span>
    </div>
  );
}

export function WalletCard({ activeCircles = 0 }: { activeCircles?: number }) {
  const { address, reputation } = useWallet();

  if (!address) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Wallet className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-600">
          Connect your wallet to view your reputation and active circles.
        </p>
      </div>
    );
  }

  const rep = reputation
    ? formatReputation(reputation.score)
    : formatReputation(100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Connected
          </p>
          <p className="font-mono text-sm font-semibold text-gray-900">
            {shortAddr(address, 6, 6)}
          </p>
        </div>
        <span
          className={cx(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            reputation?.in_good_standing
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          {rep.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cx(
              "h-1.5 flex-1 rounded-full",
              i < rep.stars ? "bg-brand-500" : "bg-gray-200"
            )}
          />
        ))}
        <span className={cx("ml-2 text-sm font-bold", rep.color)}>
          {reputation?.score ?? 100}
        </span>
      </div>

      <div className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
        <StatRow
          icon={<Users className="h-4 w-4" />}
          label="Circles joined"
          value={String(reputation?.circles_joined ?? 0)}
        />
        <StatRow
          icon={<Users className="h-4 w-4" />}
          label="Active circles"
          value={String(activeCircles)}
          accent="text-brand-600"
        />
        <StatRow
          icon={<Shield className="h-4 w-4" />}
          label="Defaults"
          value={String(reputation?.defaults ?? 0)}
          accent={
            (reputation?.defaults ?? 0) > 0 ? "text-red-600" : undefined
          }
        />
        <StatRow
          icon={<Wallet className="h-4 w-4" />}
          label="Contribution / round"
          value={`${formatXlm(BigInt(STROOPS_PER_XLM) * 5n)} XLM`}
        />
      </div>
    </div>
  );
}
