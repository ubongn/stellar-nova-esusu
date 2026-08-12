import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleInfo } from "../lib/types";
import { fetchCircles } from "../lib/contract";
import { POLL_INTERVAL_MS } from "../lib/config";

interface UseCirclesResult {
  circles: CircleInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Fetch + poll all circles from the SavingsPool contract. */
export function useCircles(autoRefresh = true): UseCirclesResult {
  const [circles, setCircles] = useState<CircleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCircles();
      if (!mounted.current) return;
      setCircles(data);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to load circles");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    if (autoRefresh) {
      const id = window.setInterval(refresh, POLL_INTERVAL_MS);
      return () => {
        mounted.current = false;
        window.clearInterval(id);
      };
    }
    return () => {
      mounted.current = false;
    };
  }, [refresh, autoRefresh]);

  return { circles, loading, error, refresh };
}
