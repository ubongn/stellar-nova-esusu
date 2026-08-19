import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "nova-theme";

function getInitialDark(): boolean {
  if (typeof document === "undefined") return false;
  // The pre-paint script in index.html already applied the class, so trust it.
  return document.documentElement.classList.contains("dark");
}

/**
 * Light/dark theme switch. The choice is persisted in localStorage and the
 * initial class is applied before first paint by a script in index.html
 * (defaulting to the OS preference on first visit).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // storage unavailable (private mode etc.) — session-only theme is fine
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
