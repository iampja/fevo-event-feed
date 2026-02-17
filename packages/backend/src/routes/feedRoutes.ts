import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getFeed } from '../services/feedService';
import { apiKeyAuth } from '../middleware/auth';
import { defaultRateLimiter } from '../middleware/rateLimit';
import db from '../db/connection';
import { FilterParams, PaginationParams } from '../models/types';

const router = Router();

// ── Validation schemas ───────────────────────────────────────────────────────

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  segment: z.string().optional(),
  theme: z.string().optional(),
  geography: z.string().optional(),
  organization: z.string().optional(),
  event_type: z.string().optional(),
  creator: z.string().optional(),
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

      const { page, per_page, segment, theme, geography, organization, event_type, creator } =
        parsed.data;

      const filters: FilterParams = {
        segment,
        theme,
        geography,
        organization,
        event_type,
        creator,
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

export default router;
