/** @jsxImportSource preact */

import { useRef, useCallback } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { trackOfferViewed } from '../analytics';

type MarketplaceCardProps = {
  offer: Offer;
  config: WidgetConfig;
  onCardClick: (offer: Offer) => void;
};

/** Get category from organization or fallback to tags */
function getCategory(offer: Offer): string {
  if (offer.organization?.category) return offer.organization.category.toLowerCase();
  if (offer.tags && offer.tags.length > 0) return offer.tags[0].toLowerCase();
  return 'event';
}

export function MarketplaceCard({ offer, config, onCardClick }: MarketplaceCardProps) {
  const viewedRef = useRef(false);

  const cardRef = useIntersectionObserver<HTMLDivElement>((isVisible) => {
    if (isVisible && !viewedRef.current) {
      viewedRef.current = true;
      trackOfferViewed(offer.offer_id);
    }
  });

  const handleImageError = useCallback((e: Event) => {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
  }, []);

  const handleCardClick = useCallback(() => {
    onCardClick(offer);
  }, [onCardClick, offer]);

  const handleCardKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardClick(offer);
    }
  }, [onCardClick, offer]);

  const category = getCategory(offer);

  return (
    <div
      class="fevo-ef-card"
      ref={cardRef}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div class="fevo-ef-card-image-wrap">
        {offer.image_url && (
          <img
            class="fevo-ef-card-image"
            src={offer.image_url}
            alt={offer.title}
            loading="lazy"
            onError={handleImageError}
          />
        )}
      </div>

      <div class="fevo-ef-card-body">
        <span class="fevo-ef-card-category-tag" data-category={category}>
          {category.replace(/_/g, ' ')}
        </span>
        <h3 class="fevo-ef-card-title">{offer.title}</h3>

        <button
          class="fevo-ef-card-readmore"
          onClick={(e: Event) => {
            e.stopPropagation();
            onCardClick(offer);
          }}
        >
          Read more
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Hidden default footer — marketplace theme hides it via CSS */}
      <div class="fevo-ef-card-footer" />
    </div>
  );
}
