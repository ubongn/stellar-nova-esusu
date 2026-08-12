import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleInfo } from "../lib/types";
import { fetchCircle } from "../lib/contract";
import { POLL_INTERVAL_MS } from "../lib/config";

interface UseCircleResult {
  circle: CircleInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/** Fetch + poll a single circle by id. */
export function useCircle(id: number | null): UseCircleResult {
  const [circle, setCircle] = useState<CircleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (id === null) return;
    try {
      const data = await fetchCircle(id);
      if (!mounted.current) return;
      setCircle(data);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to load circle");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  return { circle, loading, error, refresh };
}
