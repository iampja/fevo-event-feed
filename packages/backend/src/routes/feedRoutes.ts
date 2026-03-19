import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getFeed } from '../services/feedService';
import { transformOffers } from '../services/feedTransformer';
import { apiKeyAuth } from '../middleware/auth';
import { defaultRateLimiter } from '../middleware/rateLimit';
import db from '../db/connection';
import { FilterParams, PaginationParams } from '../models/types';

const router = Router();

// ── Validation schemas ───────────────────────────────────────────────────────

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(1000).default(20),
  segment: z.string().optional(),
  theme: z.string().optional(),
  geography: z.string().optional(),
  organization: z.string().optional(),
  event_type: z.string().optional(),
  creator: z.string().optional(),
  search: z.string().optional(),
  mode: z.string().optional(),
});

// ── GET / ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  apiKeyAuth,
  defaultRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const parsed = feedQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { page, per_page, segment, theme, geography, organization, event_type, creator, search, mode } =
        parsed.data;

      const filters: FilterParams = {
        segment,
        theme,
        geography,
        organization,
        event_type,
        creator,
        search,
        mode,
      };

      const pagination: PaginationParams = { page, per_page };

      const feed = await getFeed(filters, pagination);

      res.json(feed);
    } catch (err) {
      console.error('Feed GET error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /segments ────────────────────────────────────────────────────────────

router.get('/segments', apiKeyAuth, defaultRateLimiter, async (_req: Request, res: Response) => {
  try {
    const segments = await db('event_feed_segments').select('*').orderBy('name');
    res.json({ data: segments });
  } catch (err) {
    console.error('Segments list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /segments/:slug ──────────────────────────────────────────────────────

router.get('/segments/:slug', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const segment = await db('event_feed_segments')
      .where('slug', req.params.slug)
      .first();

    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }

    // Include linked offers
    const offerLinks = await db('event_feed_segment_offers')
      .where('segment_id', segment.id)
      .select('offer_id', 'added_at');

    res.json({ data: { ...segment, offers: offerLinks } });
  } catch (err) {
    console.error('Segment detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /promoted ───────────────────────────────────────────────────────────

router.get('/promoted', apiKeyAuth, defaultRateLimiter, async (_req: Request, res: Response) => {
  try {
    // Find all segments with type = 'promoted'
    const promotedSegments = await db('event_feed_segments')
      .where('type', 'promoted')
      .select('id', 'name', 'slug');

    if (promotedSegments.length === 0) {
      res.json({ data: [] });
      return;
    }

    const segmentIds = promotedSegments.map((s: any) => s.id);

    // Get all offer IDs linked to promoted segments
    const offerLinks = await db('event_feed_segment_offers')
      .whereIn('segment_id', segmentIds)
      .select('segment_id', 'offer_id');

    if (offerLinks.length === 0) {
      res.json({ data: [] });
      return;
    }

    const offerIds = [...new Set(offerLinks.map((l: any) => l.offer_id))];

    // Fetch and transform those offers
    const offers = await db('offers')
      .whereIn('id', offerIds)
      .where('status', 'active');

    const transformed = await transformOffers(offers);

    // Group by segment for the response
    const segmentMap = new Map(promotedSegments.map((s: any) => [s.id, { ...s, offers: [] as any[] }]));
    const offerMap = new Map(transformed.map((o: any) => [o.offer_id, o]));

    for (const link of offerLinks) {
      const seg = segmentMap.get(link.segment_id);
      const offer = offerMap.get(link.offer_id);
      if (seg && offer) {
        seg.offers.push(offer);
      }
    }

    const result = Array.from(segmentMap.values()).filter((s: any) => s.offers.length > 0);

    res.json({ data: result });
  } catch (err) {
    console.error('Promoted feed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /geographies ────────────────────────────────────────────────────────

router.get('/geographies', apiKeyAuth, defaultRateLimiter, async (_req: Request, res: Response) => {
  try {
    const geos = await db('offers')
      .where('status', 'active')
      .whereNotNull('venue_city')
      .whereNotNull('venue_state')
      .distinct('venue_city', 'venue_state')
      .orderBy('venue_state')
      .orderBy('venue_city');
    res.json({ data: geos });
  } catch (err) {
    console.error('Geographies list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /:offerId ───────────────────────────────────────────────────────────

router.get('/:offerId', apiKeyAuth, defaultRateLimiter, async (req: Request, res: Response) => {
  try {
    const offer = await db('offers').where('id', req.params.offerId).first();
    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }
    const [transformed] = await transformOffers([offer]);
    res.json({ data: transformed });
  } catch (err) {
    console.error('Offer detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
