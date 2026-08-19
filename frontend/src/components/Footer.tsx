import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <Zap className="h-4 w-4" fill="currentColor" />
          </span>
          <span>
            <strong className="text-gray-700 dark:text-gray-300">Nova Esusu</strong> — Trustless
            rotating savings on Stellar
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-300">
            Dashboard
          </Link>
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-600 dark:hover:text-brand-300"
          >
            Stellar
          </a>
          <a
            href="https://github.com/ubongn/stellar-nova-esusu"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-600 dark:hover:text-brand-300"
          >
            GitHub
          </a>
          <span>Built for Journey to Mastery</span>
        </div>
      </div>
    </footer>
  );
}
