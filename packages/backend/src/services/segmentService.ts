import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { Segment, SegmentOffer } from '../models/types';

/**
 * List all segments.
 */
export async function listSegments(): Promise<Segment[]> {
  const rows = await db('event_feed_segments').orderBy('name', 'asc');
  return rows.map((r: any) => ({
    ...r,
    is_curated: !!r.is_curated,
  }));
}

/**
 * Get a segment by slug.
 */
export async function getSegmentBySlug(slug: string): Promise<Segment | null> {
  const segment = await db('event_feed_segments').where('slug', slug).first();
  if (!segment) return null;
  return { ...segment, is_curated: !!segment.is_curated };
}

/**
 * Get a segment by ID.
 */
export async function getSegmentById(id: string): Promise<Segment | null> {
  const segment = await db('event_feed_segments').where('id', id).first();
  if (!segment) return null;
  return { ...segment, is_curated: !!segment.is_curated };
}

/**
 * Create a new segment.
 */
export async function createSegment(data: {
  name: string;
  slug: string;
  type: 'theme' | 'geography' | 'partner' | 'promoted' | 'custom';
  rules?: Record<string, any>;
  is_curated?: boolean;
  created_by: string;
}): Promise<Segment> {
  const existing = await db('event_feed_segments').where('slug', data.slug).first();
  if (existing) {
    throw new Error(`Segment with slug "${data.slug}" already exists`);
  }

  const now = new Date().toISOString();
  const segment: Segment = {
    id: uuidv4(),
    name: data.name,
    slug: data.slug,
    type: data.type,
    rules: data.rules ? JSON.stringify(data.rules) : null,
    is_curated: data.is_curated ?? false,
    created_by: data.created_by,
    created_at: now,
    updated_at: now,
  };

  await db('event_feed_segments').insert({
    ...segment,
    is_curated: segment.is_curated ? 1 : 0,
  });

  return segment;
}

/**
 * Update an existing segment.
 */
export async function updateSegment(id: string, data: {
  name?: string;
  slug?: string;
  type?: 'theme' | 'geography' | 'partner' | 'promoted' | 'custom';
  rules?: Record<string, any>;
  is_curated?: boolean;
}): Promise<Segment> {
  const existing = await db('event_feed_segments').where('id', id).first();
  if (!existing) {
    throw new Error(`Segment not found: ${id}`);
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugConflict = await db('event_feed_segments')
      .where('slug', data.slug)
      .whereNot('id', id)
      .first();
    if (slugConflict) {
      throw new Error(`Segment with slug "${data.slug}" already exists`);
    }
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.type !== undefined) updates.type = data.type;
  if (data.rules !== undefined) updates.rules = JSON.stringify(data.rules);
  if (data.is_curated !== undefined) updates.is_curated = data.is_curated ? 1 : 0;

  await db('event_feed_segments').where('id', id).update(updates);

  const updated = await db('event_feed_segments').where('id', id).first();
  return { ...updated, is_curated: !!updated.is_curated };
}

/**
 * Delete a segment and its offer associations.
 */
export async function deleteSegment(id: string): Promise<void> {
  return db.transaction(async (trx) => {
    await trx('event_feed_segment_offers').where('segment_id', id).del();
    const deleted = await trx('event_feed_segments').where('id', id).del();
    if (deleted === 0) {
      throw new Error(`Segment not found: ${id}`);
    }
  });
}

/**
 * Add an offer to a segment.
 */
export async function addOfferToSegment(segmentId: string, offerId: string): Promise<SegmentOffer> {
  const segment = await db('event_feed_segments').where('id', segmentId).first();
  if (!segment) throw new Error(`Segment not found: ${segmentId}`);

  const offer = await db('offers').where('id', offerId).first();
  if (!offer) throw new Error(`Offer not found: ${offerId}`);

  const existing = await db('event_feed_segment_offers')
    .where('segment_id', segmentId)
    .where('offer_id', offerId)
    .first();
  if (existing) throw new Error('Offer is already in this segment');

  const record: SegmentOffer = {
    segment_id: segmentId,
    offer_id: offerId,
    added_at: new Date().toISOString(),
  };

  await db('event_feed_segment_offers').insert(record);
  return record;
}

/**
 * Remove an offer from a segment.
 */
export async function removeOfferFromSegment(segmentId: string, offerId: string): Promise<void> {
  const deleted = await db('event_feed_segment_offers')
    .where('segment_id', segmentId)
    .where('offer_id', offerId)
    .del();
  if (deleted === 0) {
    throw new Error('Offer not found in segment');
  }
}

/**
 * Get all segments that contain a given offer.
 */
export async function getSegmentsByOfferId(offerId: string): Promise<Segment[]> {
  const rows = await db('event_feed_segments')
    .join('event_feed_segment_offers', 'event_feed_segments.id', 'event_feed_segment_offers.segment_id')
    .where('event_feed_segment_offers.offer_id', offerId)
    .select('event_feed_segments.*')
    .orderBy('event_feed_segments.name', 'asc');
  return rows.map((r: any) => ({ ...r, is_curated: !!r.is_curated }));
}

/**
 * Get all offers in a segment.
 */
export async function getSegmentOffers(segmentId: string): Promise<any[]> {
  return db('offers')
    .join('event_feed_segment_offers', 'offers.id', 'event_feed_segment_offers.offer_id')
    .where('event_feed_segment_offers.segment_id', segmentId)
    .select('offers.*', 'event_feed_segment_offers.added_at as segment_added_at');
}
