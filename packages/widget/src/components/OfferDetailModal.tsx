/** @jsxImportSource preact */

import { useEffect, useCallback, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { Offer, WidgetConfig } from '../types';
import { buildCheckoutUrl } from '../utils/buildCheckoutUrl';
import { trackOfferClicked } from '../analytics';
import { formatDate } from '../utils/formatDate';
import { RewardSection } from './RewardSection';

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  limited: 'Limited',
  sold_out: 'Sold Out',
};

type OfferDetailModalProps = {
  offer: Offer;
  config: WidgetConfig;
  onClose: () => void;
};

export function OfferDetailModal({ offer, config, onClose }: OfferDetailModalProps) {
  // Create a portal container on document.body so the modal escapes any
  // parent overflow/transform that would break position:fixed.
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (!portalRef.current) {
    portalRef.current = document.createElement('div');
    portalRef.current.className = 'fevo-ef-root';
    portalRef.current.setAttribute('data-theme', config.theme || 'light');
  }

  useEffect(() => {
    const el = portalRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePanelClick = useCallback((e: Event) => {
    e.stopPropagation();
  }, []);

  const handleCtaClick = useCallback((e: Event) => {
    e.stopPropagation();
    trackOfferClicked(offer.offer_id, config.segment, config.partnerId);
  }, [offer.offer_id, config.segment, config.partnerId]);

  const isSoldOut = offer.availability === 'sold_out';
  const videoUrl = offer.media?.video_url;
  const imageUrl = offer.media?.image_url || offer.image_url;

  return createPortal(
    <div class="fevo-ef-modal-backdrop" onClick={handleBackdropClick}>
      <div
        class="fevo-ef-modal"
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-label={offer.title}
      >
        <button class="fevo-ef-modal-close" onClick={onClose} aria-label="Close">
          &#x2715;
        </button>

        <div class="fevo-ef-modal-hero">
          {videoUrl ? (
            <video src={videoUrl} controls poster={imageUrl || undefined} />
          ) : (
            imageUrl && <img src={imageUrl} alt={offer.title} />
          )}
        </div>

        <div class="fevo-ef-modal-body">
          {offer.organization && (
            <div class="fevo-ef-modal-org">
              {offer.organization.logo_url && (
                <img
                  class="fevo-ef-modal-org-logo"
                  src={offer.organization.logo_url}
                  alt={offer.organization.name}
                />
              )}
              <span class="fevo-ef-modal-org-name">{offer.organization.name}</span>
            </div>
          )}

          <h2 class="fevo-ef-modal-title">{offer.title}</h2>

          <p class="fevo-ef-modal-meta">
            <svg class="fevo-ef-modal-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(offer.date)}
          </p>

          <p class="fevo-ef-modal-meta">
            <svg class="fevo-ef-modal-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {offer.venue.name} &middot; {offer.venue.city}, {offer.venue.state}
          </p>

          <span class="fevo-ef-availability">
            <span
              class="fevo-ef-availability-dot"
              data-status={offer.availability}
            />
            {AVAILABILITY_LABELS[offer.availability] || offer.availability}
          </span>

          {offer.description && (
            <div class="fevo-ef-modal-description">{offer.description}</div>
          )}

          {offer.tags && offer.tags.length > 0 && (
            <div class="fevo-ef-modal-tags">
              {offer.tags.map((tag) => (
                <span key={tag} class="fevo-ef-modal-tag">{tag}</span>
              ))}
            </div>
          )}

          {offer.reward && (
            <RewardSection reward={offer.reward} offerTitle={offer.title} />
          )}
        </div>

        <div class="fevo-ef-modal-footer">
          <a
            class="fevo-ef-cta"
            href={isSoldOut ? undefined : buildCheckoutUrl(offer, config)}
            target="_blank"
            rel="noopener noreferrer"
            data-status={offer.availability}
            onClick={isSoldOut ? undefined : handleCtaClick}
          >
            {isSoldOut ? 'Sold Out' : 'Get Tickets'}
          </a>
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
