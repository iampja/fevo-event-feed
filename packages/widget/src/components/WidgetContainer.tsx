/** @jsxImportSource preact */

import { useEffect, useMemo } from 'preact/hooks';
import { useState, useCallback } from 'preact/hooks';
import type { Offer, WidgetConfig, WidgetState } from '../types';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { resolveGeo } from '../utils/resolveGeo';
import { trackWidgetLoaded, trackOfferDetailOpened } from '../analytics';
import { injectStyles } from '../styles';
import { OfferCard } from './OfferCard';
import { SkeletonCard } from './SkeletonCard';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { PoweredByFevo } from './PoweredByFevo';
import { OfferDetailModal } from './OfferDetailModal';

type WidgetContainerProps = {
  config: WidgetConfig;
};

export function WidgetContainer({ config }: WidgetContainerProps) {
  // Inject styles on first render
  injectStyles();

  // Geo resolution: when geo === 'auto', resolve IP location before first fetch
  const [geoReady, setGeoReady] = useState(config.geo !== 'auto');
  const [resolvedGeo, setResolvedGeo] = useState<string | null>(null);

  useEffect(() => {
    if (config.geo !== 'auto') return;
    resolveGeo().then((city) => {
      setResolvedGeo(city);
      setGeoReady(true);
    });
  }, [config.geo]);

  const effectiveConfig = useMemo<WidgetConfig>(() => {
    if (config.geo !== 'auto') return config;
    const { geo: _, ...rest } = config;
    return resolvedGeo ? { ...rest, geo: resolvedGeo } : rest;
  }, [config, resolvedGeo]);

  const { offers, isRefreshing, error, lastUpdated, retry } =
    useAutoRefresh(effectiveConfig, geoReady);

  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const handleCardClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    trackOfferDetailOpened(offer.offer_id);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  // Determine widget state
  const hasOffers = offers.length > 0;
  const isInitialLoad = !hasOffers && !error && !lastUpdated;

  let state: WidgetState;
  if (isInitialLoad) {
    state = 'loading';
  } else if (error && !hasOffers) {
    state = 'error';
  } else if (!hasOffers) {
    state = 'empty';
  } else {
    state = 'ready';
  }

  // Track widget loaded once we have data
  useEffect(() => {
    if (state === 'ready') {
      trackWidgetLoaded(config.segment, offers.length);
    }
  }, [state === 'ready']); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = config.columns || 3;
  const theme = config.theme || 'light';

  return (
    <div class="fevo-ef-root" data-theme={theme}>
      {/* Refreshing progress bar */}
      {isRefreshing && hasOffers && <div class="fevo-ef-refreshing-bar" />}

      {/* Loading state: skeleton grid */}
      {state === 'loading' && (
        <div class="fevo-ef-grid" data-columns={columns}>
          {Array.from({ length: config.maxCards || 6 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
        </div>
      )}

      {/* Error state */}
      {state === 'error' && <ErrorState message={error ?? undefined} onRetry={retry} />}

      {/* Empty state */}
      {state === 'empty' && <EmptyState />}

      {/* Ready state: offer cards */}
      {state === 'ready' && (
        <div class="fevo-ef-grid" data-columns={columns}>
          {offers.map((offer) => (
            <OfferCard
              key={offer.offer_id}
              offer={offer}
              config={config}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <PoweredByFevo />

      {/* Offer detail modal */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          config={config}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
