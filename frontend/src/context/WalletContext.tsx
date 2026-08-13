import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet,
  disconnectWallet,
  getConnectedAddress,
  classifyError,
} from "@/lib/wallet";
import { trackReputation } from "@/lib/contract";
import type { ClassifiedError, Reputation } from "@/lib/types";
import { useToast } from "./ToastContext";

interface WalletContextValue {
  address: string | null;
  connecting: boolean;
  error: ClassifiedError | null;
  reputation: Reputation | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  refreshReputation: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { push } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [reputation, setReputation] = useState<Reputation | null>(null);

  const refreshReputation = useCallback(async () => {
    if (!address) {
      setReputation(null);
      return;
    }
    try {
      const rep = await trackReputation(address);
      setReputation(rep);
    } catch {
      setReputation(null);
    }
  }, [address]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectWallet();
      setAddress(addr);
      push({ type: "success", title: "Wallet connected", message: addr });
    } catch (err) {
      const classified = classifyError(err instanceof Error ? err.cause ?? err : err);
      setError(classified);
      push({
        type: "error",
        title: "Connection failed",
        message: classified.message,
      });
    } finally {
      setConnecting(false);
    }
  }, [push]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectWallet();
    } catch {
      /* ignore */
    }
    setAddress(null);
    setReputation(null);
    setError(null);
    push({ type: "info", title: "Wallet disconnected" });
  }, [push]);

  const clearError = useCallback(() => setError(null), []);

  // Reconnect silently on mount if a wallet was previously connected.
  useEffect(() => {
    (async () => {
      const addr = await getConnectedAddress();
      if (addr) setAddress(addr);
    })();
  }, []);

  useEffect(() => {
    if (address) refreshReputation();
  }, [address, refreshReputation]);

  const value = useMemo(
    () => ({
      address,
      connecting,
      error,
      reputation,
      connect,
      disconnect,
      clearError,
      refreshReputation,
    }),
    [address, connecting, error, reputation, connect, disconnect, clearError, refreshReputation]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
