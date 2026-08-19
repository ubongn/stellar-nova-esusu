import { useToast } from "./ToastProvider";
import { CheckIcon, AlertIcon, InfoIcon, XIcon } from "./Icons";
import { cn } from "../lib/utils";
import type { ToastType } from "../lib/types";

const STYLES: Record<ToastType, { bg: string; icon: typeof CheckIcon; ring: string }> = {
  success: { bg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300", icon: CheckIcon, ring: "ring-emerald-200" },
  error: { bg: "bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300", icon: AlertIcon, ring: "ring-red-200" },
  info: { bg: "bg-brand-50 dark:bg-brand-500/10 text-brand-800 dark:text-brand-300", icon: InfoIcon, ring: "ring-brand-200" },
};

/** Fixed top-right toast stack. Mounted once at the app root. */
export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const style = STYLES[t.type];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "toast-enter pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-card-hover ring-1",
              style.bg,
              style.ring
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium leading-5">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="flex-shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
