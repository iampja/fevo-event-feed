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
import { FilterBar } from './FilterBar';

type MarketplacePageProps = {
  config: WidgetConfig;
};

const INITIAL_VISIBLE = 9;

export function MarketplacePage({ config }: MarketplacePageProps) {
  injectStyles();

  const [activeSegment, setActiveSegment] = useState<string | null>(config.segment || null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Build effective config — segment goes to the API
  const effectiveConfig = useMemo<WidgetConfig>(() => ({
    ...config,
    segment: activeSegment || undefined,
    theme: config.theme || 'marketplace',
    maxCards: config.maxCards || 500,
  }), [config, activeSegment]);

  const { offers, isRefreshing, error, lastUpdated, retry } = useAutoRefresh(effectiveConfig);

  const visibleOffers = useMemo(() => offers.slice(0, visibleCount), [offers, visibleCount]);

  const handleSegmentChange = useCallback((slug: string | null) => {
    setActiveSegment(slug);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const handleCardClick = useCallback((offer: Offer) => {
    setSelectedOffer(offer);
    trackOfferDetailOpened(offer.offer_id);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedOffer(null);
  }, []);

  const handleSeeMore = useCallback(() => {
    setVisibleCount((prev) => prev + 9);
  }, []);

  const hasOffers = visibleOffers.length > 0;
  const hasAnyOffers = offers.length > 0;
  const isInitialLoad = !hasAnyOffers && !error && !lastUpdated;
  const hasMore = visibleCount < offers.length;

  useEffect(() => {
    if (hasAnyOffers && lastUpdated) {
      trackWidgetLoaded(effectiveConfig.segment, offers.length);
    }
  }, [hasAnyOffers && !!lastUpdated]); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = effectiveConfig.theme || 'marketplace';

  return (
    <div class="fevo-ef-root" data-theme={theme}>
      {isRefreshing && hasAnyOffers && <div class="fevo-ef-refreshing-bar" />}

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
          <span class="fevo-ef-marketplace-hero-badge">Case Study</span>
          <h1 class="fevo-ef-marketplace-hero-title">Unlocking New Fan Segments</h1>
          <p class="fevo-ef-marketplace-hero-subtitle">
            Discover how teams and organizations use FEVO to drive group ticket sales and fan engagement.
          </p>
          <div class="fevo-ef-marketplace-hero-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div class="fevo-ef-marketplace-filter-section">
        <FilterBar
          config={config}
          activeSegment={activeSegment}
          activeGeo={null}
          onSegmentChange={handleSegmentChange}
          onGeoChange={() => {}}
          hideGeo
        />
      </div>

      {/* Section title */}
      <h2 class="fevo-ef-marketplace-section-title">Recent Case Studies</h2>

      {isInitialLoad && (
        <div class="fevo-ef-grid" data-columns={config.columns || 3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
          ))}
        </div>
      )}

      {!isInitialLoad && error && !hasAnyOffers && (
        <ErrorState message={error ?? undefined} onRetry={retry} />
      )}

      {!isInitialLoad && !error && !hasOffers && <EmptyState />}

      {hasOffers && (
        <div class="fevo-ef-grid" data-columns={config.columns || 3}>
          {visibleOffers.map((offer) => (
            <MarketplaceCard
              key={offer.offer_id}
              offer={offer}
              config={effectiveConfig}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {hasOffers && hasMore && (
        <div class="fevo-ef-marketplace-see-more-row">
          <button class="fevo-ef-marketplace-see-more" onClick={handleSeeMore}>
            See More
          </button>
        </div>
      )}

      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          config={effectiveConfig}
          onClose={handleModalClose}
        />
      )}

      {/* Footer */}
      <footer class="fevo-ef-marketplace-footer">
        <div class="fevo-ef-marketplace-footer-inner">
          <div class="fevo-ef-marketplace-footer-brand">
            <span class="fevo-ef-marketplace-footer-logo">FEVO</span>
            <p class="fevo-ef-marketplace-footer-tagline">
              The social commerce platform for live events. Buy together, experience together.
            </p>
          </div>
          <div class="fevo-ef-marketplace-footer-links">
            <div class="fevo-ef-marketplace-footer-col">
              <h4>Product</h4>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">Platform</a>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">Pricing</a>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">Case Studies</a>
            </div>
            <div class="fevo-ef-marketplace-footer-col">
              <h4>Company</h4>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">About</a>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">Careers</a>
              <a href="https://www.gofevo.com" target="_blank" rel="noopener noreferrer">Contact</a>
            </div>
          </div>
        </div>
        <div class="fevo-ef-marketplace-footer-bottom">
          <span>&copy; {new Date().getFullYear()} FEVO. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
