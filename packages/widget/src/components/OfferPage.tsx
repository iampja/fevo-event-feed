/** @jsxImportSource preact */

import { useState, useEffect } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import { fetchOffer } from '../api';
import { buildCheckoutUrl } from '../utils/buildCheckoutUrl';
import { formatDate } from '../utils/formatDate';
import { RewardSection } from './RewardSection';
import { injectStyles } from '../styles';

type OfferPageProps = {
  offerId: string;
  config: WidgetConfig;
};

export function OfferPage({ offerId, config }: OfferPageProps) {
  injectStyles();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffer(config, offerId)
      .then((res) => setOffer(res.data as any))
      .catch((err) => setError(err.message));
  }, [offerId, config.apiUrl, config.apiKey]);

  const theme = config.theme || 'marketplace';

  if (error) {
    return (
      <div class="fevo-ef-root" data-theme={theme}>
        <div class="fevo-ef-offer-page-error"><p>{error}</p></div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div class="fevo-ef-root" data-theme={theme}>
        <div class="fevo-ef-offer-page-loading">Loading...</div>
      </div>
    );
  }

  const imageUrl = offer.media?.image_url || offer.image_url;
  const videoUrl = offer.media?.video_url;
  const isSoldOut = offer.availability === 'sold_out';

  return (
    <div class="fevo-ef-root" data-theme={theme}>
      <div class="fevo-ef-offer-page">
        <div class="fevo-ef-offer-page-hero">
          {videoUrl ? (
            <video src={videoUrl} controls poster={imageUrl || undefined} />
          ) : (
            imageUrl && <img src={imageUrl} alt={offer.title} />
          )}
        </div>

        <div class="fevo-ef-offer-page-content">
          {offer.organization && (
            <div class="fevo-ef-modal-org">
              {offer.organization.logo_url && (
                <img class="fevo-ef-modal-org-logo" src={offer.organization.logo_url} alt={offer.organization.name} />
              )}
              <span class="fevo-ef-modal-org-name">{offer.organization.name}</span>
            </div>
          )}

          <h1 class="fevo-ef-offer-page-title">{offer.title}</h1>

          <div class="fevo-ef-offer-page-meta">
            <p class="fevo-ef-modal-meta">
              <svg class="fevo-ef-modal-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(offer.date)}
            </p>
            <p class="fevo-ef-modal-meta">
              <svg class="fevo-ef-modal-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {offer.venue.name} &middot; {offer.venue.city}, {offer.venue.state}
            </p>
          </div>

          {offer.description && (
            <div class="fevo-ef-modal-description" dangerouslySetInnerHTML={{ __html: offer.description }} />
          )}

          {offer.reward && <RewardSection reward={offer.reward} offerTitle={offer.title} />}

          <div class="fevo-ef-offer-page-cta">
            <a
              class="fevo-ef-cta"
              href={isSoldOut ? undefined : buildCheckoutUrl(offer, config)}
              target="_blank"
              rel="noopener noreferrer"
              data-status={offer.availability}
            >
              {isSoldOut ? 'Sold Out' : 'Get Tickets'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
