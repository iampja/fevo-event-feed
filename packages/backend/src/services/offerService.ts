import db from '../db/connection';
import { Offer } from '../models/types';

export interface OfferListParams {
  page?: number;
  per_page?: number;
  status?: string;
  distribution_enabled?: boolean;
  organization_id?: string;
  segment_id?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

/**
 * List offers with filtering, search, and pagination.
 */
export async function listOffers(params: OfferListParams = {}): Promise<{
  data: Offer[];
  meta: { total: number; page: number; per_page: number; total_pages: number };
}> {
  const {
    page = 1,
    per_page = 25,
    status,
    distribution_enabled,
    organization_id,
    segment_id,
    search,
    sort_by = 'created_at',
    sort_dir = 'desc',
  } = params;

  let query = db('offers');
  let countQuery = db('offers');

  if (segment_id) {
    query = query
      .join('event_feed_segment_offers', 'offers.id', 'event_feed_segment_offers.offer_id')
      .where('event_feed_segment_offers.segment_id', segment_id)
      .select('offers.*');
    countQuery = countQuery
      .join('event_feed_segment_offers', 'offers.id', 'event_feed_segment_offers.offer_id')
      .where('event_feed_segment_offers.segment_id', segment_id);
  }

  if (status) {
    query = query.where('status', status);
    countQuery = countQuery.where('status', status);
  }

  if (distribution_enabled !== undefined) {
    query = query.where('distribution_enabled', distribution_enabled);
    countQuery = countQuery.where('distribution_enabled', distribution_enabled);
  }

  if (organization_id) {
    query = query.where('organization_id', organization_id);
    countQuery = countQuery.where('organization_id', organization_id);
  }

  if (search) {
    const like = `%${search}%`;
    const searchWhere = function (this: any) {
      this.where('title', 'like', like)
        .orWhere('venue_name', 'like', like)
        .orWhere('venue_city', 'like', like)
        .orWhere('organization_name', 'like', like);
    };
    query = query.where(searchWhere);
    countQuery = countQuery.where(searchWhere);
  }

  const countResult = await countQuery.count('id as count').first();
  const total = Number(countResult?.count || 0);

  const allowedSorts = ['created_at', 'updated_at', 'date', 'title', 'price_min', 'status', 'source', 'organization_name', 'distribution_enabled'];
  const safeSortBy = allowedSorts.includes(sort_by) ? sort_by : 'created_at';

  const data = await query
    .orderBy('distribution_enabled', 'desc')
    .orderBy(safeSortBy, sort_dir)
    .limit(per_page)
    .offset((page - 1) * per_page);

  // Attach collection names to each offer
  const offerIds = data.map((o: any) => o.id);
  let segmentMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  if (offerIds.length > 0) {
    const segRows = await db('event_feed_segment_offers')
      .join('event_feed_segments', 'event_feed_segments.id', 'event_feed_segment_offers.segment_id')
      .whereIn('event_feed_segment_offers.offer_id', offerIds)
      .select(
        'event_feed_segment_offers.offer_id',
        'event_feed_segments.id as segment_id',
        'event_feed_segments.name',
        'event_feed_segments.slug',
      )
      .orderBy('event_feed_segments.name', 'asc');
    for (const row of segRows) {
      if (!segmentMap[row.offer_id]) segmentMap[row.offer_id] = [];
      segmentMap[row.offer_id].push({ id: row.segment_id, name: row.name, slug: row.slug });
    }
  }

  const enrichedData = data.map((o: any) => ({
    ...o,
    collections: segmentMap[o.id] || [],
  }));

  return {
    data: enrichedData,
    meta: {
      total,
      page,
      per_page,
      total_pages: Math.ceil(total / per_page) || 1,
    },
  };
}

/**
 * Get a single offer by ID.
 */
export async function getOfferById(id: string): Promise<Offer | null> {
  const offer = await db('offers').where('id', id).first();
  return offer || null;
}

/**
 * Get all offers for an organization.
 */
export async function getOffersByOrganization(orgId: string): Promise<Offer[]> {
  return db('offers').where('organization_id', orgId).orderBy('date', 'asc');
}

/**
 * Get aggregate statistics about offers.
 */
export async function getOfferStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  sold_out: number;
  deleted: number;
  distribution_enabled: number;
  distribution_disabled: number;
  by_organization: Array<{ organization_id: string; organization_name: string; count: number }>;
}> {
  const total = await db('offers').count('id as count').first();
  const active = await db('offers').where('status', 'active').count('id as count').first();
  const inactive = await db('offers').where('status', 'inactive').count('id as count').first();
  const sold_out = await db('offers').where('status', 'sold_out').count('id as count').first();
  const deleted = await db('offers').where('status', 'deleted').count('id as count').first();
  const distEnabled = await db('offers').where('distribution_enabled', true).count('id as count').first();
  const distDisabled = await db('offers').where('distribution_enabled', false).count('id as count').first();

  const byOrg = await db('offers')
    .select('organization_id', 'organization_name')
    .count('id as count')
    .groupBy('organization_id', 'organization_name')
    .orderBy('count', 'desc');

  return {
    total: Number(total?.count || 0),
    active: Number(active?.count || 0),
    inactive: Number(inactive?.count || 0),
    sold_out: Number(sold_out?.count || 0),
    deleted: Number(deleted?.count || 0),
    distribution_enabled: Number(distEnabled?.count || 0),
    distribution_disabled: Number(distDisabled?.count || 0),
    by_organization: byOrg.map((r: any) => ({
      organization_id: r.organization_id,
      organization_name: r.organization_name,
      count: Number(r.count),
    })),
  };
}
