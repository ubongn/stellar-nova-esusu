import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cx } from "@/lib/utils";
import type { Toast } from "@/lib/types";

const STYLES: Record<
  Toast["type"],
  { icon: typeof Info; ring: string; bg: string; text: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: "border-emerald-200",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  info: {
    icon: Info,
    ring: "border-brand-200",
    bg: "bg-brand-50 dark:bg-brand-500/10",
    text: "text-brand-800 dark:text-brand-300",
  },
  error: {
    icon: XCircle,
    ring: "border-red-200",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-800 dark:text-red-300",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const s = STYLES[t.type];
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-card-hover animate-[fadeIn_0.2s_ease-out]",
              s.ring,
              s.bg,
              s.text
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.message && <p className="text-xs opacity-80">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-0.5 opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
