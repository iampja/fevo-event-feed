import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import {
  Offer,
  FeedResponse,
  FeedMeta,
  PaginationParams,
  FilterParams,
  FeedExclusion,
} from '../models/types';

const CACHE_KEY = 'event_feed_main';

/**
 * Build (or rebuild) the main feed index.
 * Fetches all eligible offers and writes them into the feed_cache table.
 */
export async function buildFeedIndex(): Promise<number> {
  const offers: Offer[] = await db('offers')
    .where('distribution_enabled', true)
    .where('status', 'active')
    .orderBy('date', 'asc');

  const builtAt = new Date().toISOString();
  const payload = JSON.stringify(offers);

  // Upsert into cache
  const existing = await db('feed_cache').where('cache_key', CACHE_KEY).first();
  if (existing) {
    await db('feed_cache').where('cache_key', CACHE_KEY).update({
      data: payload,
      built_at: builtAt,
    });
  } else {
    await db('feed_cache').insert({
      cache_key: CACHE_KEY,
      data: payload,
      built_at: builtAt,
    });
  }

  return offers.length;
}

/**
 * Get the current feed, applying exclusions, filters, and pagination.
 */
export async function getFeed(
  filters: FilterParams,
  pagination: PaginationParams
): Promise<FeedResponse> {
  // Read from cache
  const cached = await db('feed_cache').where('cache_key', CACHE_KEY).first();

  let allOffers: Offer[] = [];
  let builtAt: string | null = null;

  if (cached) {
    allOffers = JSON.parse(cached.data) as Offer[];
    builtAt = cached.built_at;
  } else {
    // Fallback: query directly
    allOffers = await db('offers')
      .where('distribution_enabled', true)
      .where('status', 'active')
      .orderBy('date', 'asc');
    builtAt = new Date().toISOString();
  }

  // Apply exclusion list
  const exclusions = await getExclusions();
  const excludedOfferIds = new Set(exclusions.map((e) => e.offer_id));
  let filtered = allOffers.filter((o) => !excludedOfferIds.has(o.id));

  // Apply segment filter
  if (filters.segment) {
    const segment = await db('event_feed_segments').where('slug', filters.segment).first();
    if (segment) {
      const segmentOfferRows = await db('event_feed_segment_offers')
        .where('segment_id', segment.id)
        .select('offer_id');
      const segmentOfferIds = new Set(segmentOfferRows.map((r: { offer_id: string }) => r.offer_id));
      filtered = filtered.filter((o) => segmentOfferIds.has(o.id));
    } else {
      filtered = [];
    }
  }

  // Apply tag-based filters (theme, event_type, creator)
  if (filters.theme) {
    filtered = filterByTag(filtered, filters.theme);
  }
  if (filters.event_type) {
    filtered = filterByTag(filtered, filters.event_type);
  }
  if (filters.creator) {
    filtered = filtered.filter(
      (o) => o.organization_name?.toLowerCase() === filters.creator!.toLowerCase()
    );
  }

  // Apply geography filter
  if (filters.geography) {
    const geo = filters.geography.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.venue_city?.toLowerCase() === geo ||
        o.venue_state?.toLowerCase() === geo
    );
  }

  // Apply organization filter
  if (filters.organization) {
    filtered = filtered.filter(
      (o) => o.organization_id === filters.organization
    );
  }

  // Pagination
  const total = filtered.length;
  const { page, per_page } = pagination;
  const totalPages = Math.ceil(total / per_page) || 1;
  const start = (page - 1) * per_page;
  const paged = filtered.slice(start, start + per_page);

  const meta: FeedMeta = {
    total,
    page,
    per_page,
    total_pages: totalPages,
    built_at: builtAt,
  };

  return { data: paged, meta };
}

/**
 * Get all active exclusions.
 */
export async function getExclusions(): Promise<FeedExclusion[]> {
  return db('feed_exclusions').select('*');
}

/**
 * Add an offer to the exclusion list.
 */
export async function addExclusion(
  offerId: string,
  reason: FeedExclusion['reason']
): Promise<FeedExclusion> {
  // Avoid duplicates
  const existing = await db('feed_exclusions').where('offer_id', offerId).first();
  if (existing) {
    return existing as FeedExclusion;
  }

  const exclusion: FeedExclusion = {
    id: uuidv4(),
    offer_id: offerId,
    reason,
    excluded_at: new Date().toISOString(),
  };
  await db('feed_exclusions').insert(exclusion);
  return exclusion;
}

/**
 * Remove an offer from the exclusion list.
 */
export async function removeExclusion(offerId: string): Promise<void> {
  await db('feed_exclusions').where('offer_id', offerId).del();
}

// ── helpers ──────────────────────────────────────────────────────────────────

function filterByTag(offers: Offer[], tag: string): Offer[] {
  const needle = tag.toLowerCase();
  return offers.filter((o) => {
    if (!o.tags) return false;
    try {
      const tags: string[] = JSON.parse(o.tags);
      return tags.some((t) => t.toLowerCase() === needle);
    } catch {
      return false;
    }
  });
}
