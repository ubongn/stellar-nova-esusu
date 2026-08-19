import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

const GOOGLE_FORM_EMBED =
  "https://docs.google.com/forms/d/e/1FAIpQLSdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/viewform?embedded=true";

export function FeedbackForm() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <MessageSquare className="h-5 w-5 text-brand-500" />
          Feedback
        </h2>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
        >
          {open ? "Hide" : "Give feedback"}
        </button>
      </div>

      {open ? (
        <div className="relative mt-3">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 z-10 rounded-md bg-white dark:bg-gray-900 p-1 text-gray-400 dark:text-gray-500 shadow hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close feedback"
          >
            <X className="h-4 w-4" />
          </button>
          <iframe
            src={GOOGLE_FORM_EMBED}
            title="Nova Esusu Feedback"
            className="h-[480px] w-full rounded-xl border border-gray-200 dark:border-gray-800"
            loading="lazy"
          >
            Loading…
          </iframe>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Help us improve Nova Esusu. Your feedback shapes the roadmap.
        </p>
      )}
    </div>
  );
}
