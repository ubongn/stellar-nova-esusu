import { useState, useRef, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { shortAddr } from "../lib/utils";
import { WalletIcon, SpinnerIcon, XIcon, CheckIcon } from "./Icons";

/** Connect / disconnect button with a dropdown for the connected address. */
export function WalletButton() {
  const { address, connecting, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="btn-primary"
        aria-busy={connecting}
      >
        {connecting ? (
          <>
            <SpinnerIcon className="h-4 w-4" />
            Connecting…
          </>
        ) : (
          <>
            <WalletIcon className="h-4 w-4" />
            Connect wallet
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="btn-secondary"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        <span className="font-mono text-sm">{shortAddr(address)}</span>
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-card-hover"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Connected
            </p>
            <p className="mt-0.5 break-all font-mono text-xs text-gray-700">{address}</p>
          </div>
          <div className="px-4 py-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckIcon className="h-3 w-3" /> Wallet ready
            </span>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              disconnect();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <XIcon className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
