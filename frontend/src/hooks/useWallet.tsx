import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Reputation } from "../lib/types";
import {
  connectWallet,
  disconnectWallet,
  tryGetAddress,
  initWallet,
} from "../lib/wallet";
import { fetchReputation } from "../lib/contract";
import { classifyError } from "../lib/errors";

interface WalletContextValue {
  address: string | null;
  reputation: Reputation | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-connect on load if the wallet already remembers an address.
  useEffect(() => {
    initWallet();
    tryGetAddress().then((existing) => {
      if (existing) {
        setAddress(existing);
        fetchReputation(existing)
          .then(setReputation)
          .catch(() => setReputation(null));
      }
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      try {
        const rep = await fetchReputation(addr);
        setReputation(rep);
      } catch {
        setReputation(null);
      }
    } catch (err) {
      const classified = classifyError(err);
      setError(classified.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch {
      /* ignore */
    }
    setAddress(null);
    setReputation(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ address, reputation, connecting, error, connect, disconnect }),
    [address, reputation, connecting, error, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
