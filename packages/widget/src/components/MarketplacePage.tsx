/** @jsxImportSource preact */

import { useState, useCallback, useMemo, useEffect } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { trackWidgetLoaded, trackOfferDetailOpened } from '../analytics';
import { injectStyles } from '../styles';
import { OfferCard } from './OfferCard';
import { SkeletonCard } from './SkeletonCard';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { OfferDetailModal } from './OfferDetailModal';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { CreateOfferCTA } from './CreateOfferCTA';

type MarketplacePageProps = {
  config: WidgetConfig;
};

export function MarketplacePage({ config }: MarketplacePageProps) {
  injectStyles();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState<string | null>(config.segment || null);
  const [activeGeo, setActiveGeo] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Build effective config with search/filter state
  const effectiveConfig = useMemo<WidgetConfig>(() => ({
    ...config,
    segment: activeSegment || undefined,
    search: searchQuery || undefined,
    geo: activeGeo || undefined,
    theme: config.theme || 'marketplace',
    maxCards: config.maxCards || 100,
  }), [config, searchQuery, activeSegment, activeGeo]);

  const { offers, isRefreshing, error, lastUpdated, retry } = useAutoRefresh(effectiveConfig);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSegmentChange = useCallback((slug: string | null) => {
    setActiveSegment(slug);
  }, []);

  const handleGeoChange = useCallback((geo: string | null) => {
    setActiveGeo(geo);
  }, []);

  const handleCardClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    trackOfferDetailOpened(offer.offer_id);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  const hasOffers = offers.length > 0;
  const isInitialLoad = !hasOffers && !error && !lastUpdated;

  useEffect(() => {
    if (hasOffers && lastUpdated) {
      trackWidgetLoaded(effectiveConfig.segment, offers.length);
    }
  }, [hasOffers && !!lastUpdated]); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = effectiveConfig.theme || 'marketplace';

  return (
    <div class="fevo-ef-root" data-theme={theme}>
      {isRefreshing && hasOffers && <div class="fevo-ef-refreshing-bar" />}

      <div class="fevo-ef-marketplace-toolbar">
        <SearchBar onSearch={handleSearch} />
        <FilterBar
          config={config}
          activeSegment={activeSegment}
          activeGeo={activeGeo}
          onSegmentChange={handleSegmentChange}
          onGeoChange={handleGeoChange}
        />
      </div>

      {isInitialLoad && (
        <div class="fevo-ef-grid" data-columns={config.columns || 4}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
        </div>
      )}

      {!isInitialLoad && error && !hasOffers && (
        <ErrorState message={error ?? undefined} onRetry={retry} />
      )}

      {!isInitialLoad && !error && !hasOffers && <EmptyState />}

      {hasOffers && (
        <div class="fevo-ef-grid" data-columns={config.columns || 4}>
          {offers.map((offer) => (
            <OfferCard
              key={offer.offer_id}
              offer={offer}
              config={effectiveConfig}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <CreateOfferCTA signupUrl={config.signupUrl} />

      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          config={effectiveConfig}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
