import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Toast } from "@/lib/types";

interface ToastContextValue {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${++counter.current}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
