import { Link, NavLink } from "react-router-dom";
import { Wallet, Zap } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { useWallet } from "@/context/WalletContext";
import { Spinner } from "./Spinner";
import { shortAddr, cx } from "@/lib/utils";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card-hover">
        <Zap className="h-5 w-5" fill="currentColor" />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-gray-900">
        Nova<span className="text-brand-600">Esusu</span>
      </span>
    </Link>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
    isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
  );

export function Header() {
  const { address, connect, connecting, disconnect } = useWallet();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/" className={navLinkClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/create" className={navLinkClass}>
              Create
            </NavLink>
            <NavLink to="/join" className={navLinkClass}>
              Join
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Testnet
          </span>
          <a
            href="https://github.com/ubongn/stellar-nova-esusu"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 sm:block"
            aria-label="GitHub repository"
          >
            <GithubIcon className="h-5 w-5" />
          </a>

          {address ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
                <Wallet className="h-4 w-4 text-brand-500" />
                {shortAddr(address)}
              </span>
              <button
                onClick={disconnect}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
            >
              {connecting ? <Spinner /> : <Wallet className="h-4 w-4" />}
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
