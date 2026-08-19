import { Loader2 } from "lucide-react";
import { cx } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("h-4 w-4 animate-spin", className)} />;
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500 dark:text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
