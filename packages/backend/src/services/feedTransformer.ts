import db from '../db/connection';
import { Offer, FeedOffer, FeedReward, OfferSource } from '../models/types';
import { getRewardsByOfferIds } from './rewardService';

/**
 * Transform a flat DB offer row into the nested FEVO-shaped JSON
 * that the widget expects.
 */
export function transformOffer(offer: Offer, orgLogoUrl?: string | null, reward?: FeedReward): FeedOffer {
  let tags: string[] = [];
  if (offer.tags) {
    try {
      tags = JSON.parse(offer.tags);
    } catch {
      tags = [];
    }
  }

  // Build display date string
  let displayDate: string | null = null;
  if (offer.date) {
    try {
      const d = new Date(offer.date);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      }
    } catch {
      displayDate = offer.date;
    }
  }

  return {
    offer_id: offer.id,
    title: offer.title,
    description: offer.description,
    image_url: offer.image_url,
    price: {
      min: offer.price_min,
      max: offer.price_max,
      currency: offer.currency || 'USD',
    },
    date: {
      utc: offer.date,
      timezone: null, // Will be populated from venue/event timezone when available
      display: displayDate,
    },
    venue: {
      name: offer.venue_name,
      city: offer.venue_city,
      state: offer.venue_state,
    },
    organization: {
      id: offer.organization_id,
      name: offer.organization_name,
      logo_url: orgLogoUrl ?? null,
      category: offer.category ?? null,
      subcategory: offer.subcategory ?? null,
    },
    availability: offer.availability,
    checkout_url: offer.checkout_url,
    tags,
    media: {
      image_url: offer.image_url,
      video_url: offer.video_url ?? null,
    },
    ...(reward ? { reward } : {}),
    source: (offer.source as OfferSource) || 'manual',
    created_at: offer.created_at,
    updated_at: offer.updated_at,
  };
}

/**
 * Transform an array of flat DB offer rows into nested FEVO-shaped JSON.
 * Batch-fetches organization logo_urls for efficiency.
 */
export async function transformOffers(offers: Offer[]): Promise<FeedOffer[]> {
  if (offers.length === 0) return [];

  // Collect unique org IDs and batch-fetch logos
  const orgIds = [...new Set(offers.map((o) => o.organization_id).filter(Boolean))] as string[];
  const orgLogos: Record<string, string | null> = {};

  if (orgIds.length > 0) {
    const orgs = await db('organizations')
      .whereIn('id', orgIds)
      .select('id', 'logo_url');
    for (const org of orgs) {
      orgLogos[org.id] = org.logo_url;
    }
  }

  // Batch-fetch reward programs for these offers
  const offerIds = offers.map((o) => o.id);
  const rewardsByOffer = await getRewardsByOfferIds(offerIds);

  return offers.map((offer) =>
    transformOffer(
      offer,
      offer.organization_id ? orgLogos[offer.organization_id] : null,
      rewardsByOffer[offer.id]
    )
  );
}
