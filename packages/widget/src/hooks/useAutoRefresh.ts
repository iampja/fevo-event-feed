import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { fetchFeed } from '../api';
import { trackWidgetRefreshed, trackWidgetError } from '../analytics';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export type UseAutoRefreshResult = {
  offers: Offer[];
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
  retry: () => void;
};

export function useAutoRefresh(config: WidgetConfig): UseAutoRefreshResult {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const offersRef = useRef<Offer[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const isMountedRef = useRef(true);

  const loadFeed = useCallback(
    async (isInitial: boolean) => {
      if (!isMountedRef.current) return;

      if (!isInitial) {
        setIsRefreshing(true);
      }

      try {
        const response = await fetchFeed(config);

        if (!isMountedRef.current) return;

        const newOffers = response.data;

        // Compare with current offers to detect changes
        if (!isInitial) {
          const oldIds = new Set(offersRef.current.map((o) => o.offer_id));
          const newIds = new Set(newOffers.map((o) => o.offer_id));

          const added = newOffers.filter((o) => !oldIds.has(o.offer_id)).length;
          const removed = offersRef.current.filter(
            (o) => !newIds.has(o.offer_id),
          ).length;

          if (added > 0 || removed > 0) {
            trackWidgetRefreshed(added, removed);
          }
        }

        offersRef.current = newOffers;
        setOffers(newOffers);
        setLastUpdated(response.feed_updated_at);
        setError(null);
      } catch (err) {
        if (!isMountedRef.current) return;

        const message =
          err instanceof Error ? err.message : 'Unable to load offers.';
        setError(message);
        trackWidgetError(
          err instanceof Error ? err.name : 'UNKNOWN',
          config.segment,
        );
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [config],
  );

  const retry = useCallback(() => {
    setError(null);
    loadFeed(true);
  }, [loadFeed]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    loadFeed(true);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadFeed]);

  // Polling with Page Visibility awareness
  useEffect(() => {
    const startPolling = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (isVisibleRef.current) {
          loadFeed(false);
        }
      }, POLL_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        // Fetch immediately when tab becomes visible again
        loadFeed(false);
        startPolling();
      } else {
        // Stop polling when tab hidden
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadFeed]);

  return { offers, isRefreshing, error, lastUpdated, retry };
}
