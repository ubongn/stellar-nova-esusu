import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleEvent } from "../lib/types";
import { fetchEvents } from "../lib/contract";
import { POLL_INTERVAL_MS } from "../lib/config";

interface UseEventsResult {
  events: CircleEvent[];
  loading: boolean;
  error: string | null;
}

/** Live event feed, polled from the Soroban RPC getEvents endpoint. */
export function useEvents(limit = 30, autoRefresh = true): UseEventsResult {
  const [events, setEvents] = useState<CircleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchEvents(limit);
      if (!mounted.current) return;
      setEvents(data);
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    mounted.current = true;
    load();
    if (autoRefresh) {
      const id = window.setInterval(load, POLL_INTERVAL_MS);
      return () => {
        mounted.current = false;
        window.clearInterval(id);
      };
    }
    return () => {
      mounted.current = false;
    };
  }, [load, autoRefresh]);

  return { events, loading, error };
}
