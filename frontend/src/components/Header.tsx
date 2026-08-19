import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Wallet, Zap, Menu, X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { Spinner } from "./Spinner";
import { ThemeToggle } from "./ThemeToggle";
import { shortAddr, cx } from "@/lib/utils";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card-hover sm:h-9 sm:w-9">
        <Zap className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
      </span>
      <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-lg">
        Nova<span className="text-brand-600 dark:text-brand-400">Esusu</span>
      </span>
    </Link>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/create", label: "Create", end: false },
  { to: "/join", label: "Join", end: false },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
    isActive ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
  );

export function Header() {
  const { address, connect, connecting, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Elevate the navbar once the page scrolls: solid surface + shadow.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header
      className={cx(
        "sticky top-0 z-40 border-b transition-colors duration-200",
        scrolled
          ? "border-gray-200 bg-white/95 shadow-card backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
          : "border-transparent bg-transparent dark:border-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16">
        {/* Left: Logo + Desktop nav */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Desktop extras + Wallet + Mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop-only: Testnet badge + GitHub */}
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Testnet
          </span>
          <a
            href="https://github.com/ubongn/stellar-nova-esusu"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200 sm:block"
            aria-label="GitHub repository"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <span className="hidden sm:block">
            <ThemeToggle />
          </span>

          {/* Wallet button — always visible, but compact on small screens */}
          {address ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Wallet className="h-4 w-4 text-brand-500" />
                {shortAddr(address)}
              </span>
              <button
                onClick={disconnect}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60 sm:flex"
            >
              {connecting ? <Spinner /> : <Wallet className="h-4 w-4" />}
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}

          {/* Mobile: Compact wallet icon */}
          {address && (
            <div className="flex items-center gap-1.5 sm:hidden">
              <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Wallet className="h-3.5 w-3.5 text-brand-500" />
                {shortAddr(address, 3, 3)}
              </span>
            </div>
          )}

          {/* Mobile hamburger */}
          <span className="sm:hidden">
            <ThemeToggle />
          </span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-700/60 sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className={cx(
            "border-t bg-white px-4 pb-4 pt-2 dark:bg-gray-900 sm:hidden",
            scrolled ? "border-gray-100 dark:border-gray-800" : "border-transparent dark:border-transparent"
          )}
        >
          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cx(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  location.pathname === item.to
                    ? "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href="https://github.com/ubongn/stellar-nova-esusu"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          {/* Wallet section */}
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            {address ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-950 px-3 py-2">
                  <Wallet className="h-4 w-4 text-brand-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {shortAddr(address)}
                  </span>
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Testnet
                  </span>
                </div>
                <button
                  onClick={() => {
                    disconnect();
                    setMenuOpen(false);
                  }}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  connect();
                  setMenuOpen(false);
                }}
                disabled={connecting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 disabled:opacity-60"
              >
                {connecting ? <Spinner /> : <Wallet className="h-4 w-4" />}
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
