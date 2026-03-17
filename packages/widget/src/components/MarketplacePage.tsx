/** @jsxImportSource preact */

import { useState, useCallback, useMemo, useEffect } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { trackWidgetLoaded, trackOfferDetailOpened } from '../analytics';
import { injectStyles } from '../styles';
import { MarketplaceCard } from './MarketplaceCard';
import { SkeletonCard } from './SkeletonCard';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { OfferDetailModal } from './OfferDetailModal';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';

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

      {/* Hero banner */}
      <div class="fevo-ef-marketplace-hero">
        <img
          class="fevo-ef-marketplace-hero-bg"
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"
          alt=""
          loading="eager"
        />
        <div class="fevo-ef-marketplace-hero-overlay" />
        <div class="fevo-ef-marketplace-hero-content">
          <h1 class="fevo-ef-marketplace-hero-title">Discover Live Events</h1>
          <p class="fevo-ef-marketplace-hero-subtitle">
            Browse group experiences, find the best deals, and get tickets with friends.
          </p>
        </div>
      </div>

      <div class="fevo-ef-marketplace-search-row">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div class="fevo-ef-marketplace-collections-header">
        <h2 class="fevo-ef-marketplace-section-title">Collections</h2>
        <FilterBar
          config={config}
          activeSegment={activeSegment}
          activeGeo={activeGeo}
          onSegmentChange={handleSegmentChange}
          onGeoChange={handleGeoChange}
        />
      </div>

      {isInitialLoad && (
        <div class="fevo-ef-grid" data-columns={config.columns || 3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
        </div>
      )}

      {!isInitialLoad && error && !hasOffers && (
        <ErrorState message={error ?? undefined} onRetry={retry} />
      )}

      {!isInitialLoad && !error && !hasOffers && <EmptyState />}

      {hasOffers && (
        <div class="fevo-ef-grid" data-columns={config.columns || 3}>
          {offers.map((offer) => (
            <MarketplaceCard
              key={offer.offer_id}
              offer={offer}
              config={effectiveConfig}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

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
