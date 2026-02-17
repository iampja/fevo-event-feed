/** @jsxImportSource preact */

import { useRef, useCallback } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { trackOfferViewed, trackOfferClicked } from '../analytics';
import { formatDate } from '../utils/formatDate';
import { formatPrice } from '../utils/formatPrice';

type OfferCardProps = {
  offer: Offer;
  config: WidgetConfig;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  limited: 'Limited',
  sold_out: 'Sold Out',
};

export function OfferCard({ offer, config }: OfferCardProps) {
  const viewedRef = useRef(false);

  const cardRef = useIntersectionObserver<HTMLDivElement>((isVisible) => {
    if (isVisible && !viewedRef.current) {
      viewedRef.current = true;
      trackOfferViewed(offer.offer_id);
    }
  });

  const handleImageError = useCallback(
    (e: Event) => {
      const img = e.target as HTMLImageElement;
      // Hide broken image, fallback gradient is already on the wrapper
      img.style.display = 'none';
    },
    [],
  );

  const buildCheckoutUrl = (): string => {
    try {
      const url = new URL(offer.checkout_url);
      url.searchParams.set('source', 'widget');
      if (config.segment) {
        url.searchParams.set('segment', config.segment);
      }
      if (config.partnerId) {
        url.searchParams.set('partner', config.partnerId);
      }
      return url.toString();
    } catch {
      // If checkout_url is a relative path or malformed, return as-is with query params
      const separator = offer.checkout_url.includes('?') ? '&' : '?';
      let params = `source=widget`;
      if (config.segment) params += `&segment=${encodeURIComponent(config.segment)}`;
      if (config.partnerId) params += `&partner=${encodeURIComponent(config.partnerId)}`;
      return `${offer.checkout_url}${separator}${params}`;
    }
  };

  const handleCtaClick = () => {
    trackOfferClicked(offer.offer_id, config.segment, config.partnerId);
  };

  const isSoldOut = offer.availability === 'sold_out';

  return (
    <div class="fevo-ef-card" ref={cardRef}>
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
        <h3 class="fevo-ef-card-title">{offer.title}</h3>

        <p class="fevo-ef-card-meta">
          <svg class="fevo-ef-card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(offer.date)}
        </p>

        <p class="fevo-ef-card-meta">
          <svg class="fevo-ef-card-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {offer.venue.name} &middot; {offer.venue.city}, {offer.venue.state}
        </p>

        <div class="fevo-ef-card-price">
          {formatPrice(offer.price)}
        </div>

        <div class="fevo-ef-card-footer">
          <span class="fevo-ef-availability">
            <span
              class="fevo-ef-availability-dot"
              data-status={offer.availability}
            />
            {AVAILABILITY_LABELS[offer.availability] || offer.availability}
          </span>

          <a
            class="fevo-ef-cta"
            href={isSoldOut ? undefined : buildCheckoutUrl()}
            target="_blank"
            rel="noopener noreferrer"
            data-status={offer.availability}
            onClick={isSoldOut ? undefined : handleCtaClick}
          >
            {isSoldOut ? 'Sold Out' : 'Get Tickets'}
          </a>
        </div>
      </div>
    </div>
  );
}
