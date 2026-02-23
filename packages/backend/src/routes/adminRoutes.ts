import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { internalAuth } from '../middleware/auth';
import { adminRateLimiter } from '../middleware/rateLimit';
import {
  enableDistribution,
  disableDistribution,
  getDistributionStatus,
} from '../services/distributionService';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  updateApiKeyRateLimit,
} from '../services/apiKeyService';
import {
  listSegments,
  getSegmentBySlug,
  getSegmentOffers,
  createSegment,
  updateSegment,
  deleteSegment,
  addOfferToSegment,
  removeOfferFromSegment,
} from '../services/segmentService';

import { listOffers, getOfferById, getOfferStats } from '../services/offerService';
import { triggerFeedRefresh } from '../jobs/feedRefresh';
import db from '../db/connection';

const router = Router();

// All admin routes require internal auth
router.use(internalAuth);
router.use(adminRateLimiter);

// ═══════════════════════════════════════════════════════════════════════════════
// DISTRIBUTION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

const distributionToggleSchema = z.object({
  enabled: z.boolean(),
});

router.put('/offers/:offerId/distribution', async (req: Request, res: Response) => {
  try {
    const parsed = distributionToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { offerId } = req.params;
    const { enabled } = parsed.data;

    const status = enabled
      ? await enableDistribution(offerId)
      : await disableDistribution(offerId);

    res.json({ data: status });
  } catch (err: any) {
    if (err.message?.startsWith('Offer not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message?.startsWith('Cannot enable')) {
      res.status(422).json({ error: err.message });
      return;
    }
    console.error('PUT /offers/:offerId/distribution error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/offers/:offerId/distribution', async (req: Request, res: Response) => {
  try {
    const status = await getDistributionStatus(req.params.offerId);

    if (!status) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    res.json({ data: status });
  } catch (err) {
    console.error('GET /offers/:offerId/distribution error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OFFER MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /offers/stats (must come before /offers/:offerId) ────────────────────

router.get('/offers/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getOfferStats();
    res.json({ data: stats });
  } catch (err) {
    console.error('GET /offers/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /offers ──────────────────────────────────────────────────────────────

const offerListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['active', 'inactive', 'sold_out', 'deleted']).optional(),
  distribution_enabled: z.coerce.boolean().optional(),
  organization_id: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
});

router.get('/offers', async (req: Request, res: Response) => {
  try {
    const parsed = offerListSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await listOffers(parsed.data);
    res.json(result);
  } catch (err) {
    console.error('GET /offers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /offers/:offerId ─────────────────────────────────────────────────────

router.get('/offers/:offerId', async (req: Request, res: Response) => {
  try {
    const offer = await getOfferById(req.params.offerId);

    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    res.json({ data: offer });
  } catch (err) {
    console.error('GET /offers/:offerId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api-keys ────────────────────────────────────────────────────────────

router.get('/api-keys', async (_req: Request, res: Response) => {
  try {
    const keys = await listApiKeys();
    res.json({ data: keys });
  } catch (err) {
    console.error('GET /api-keys error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api-keys ───────────────────────────────────────────────────────────

const createApiKeySchema = z.object({
  partner_name: z.string().min(1).max(255),
  rate_limit: z.number().int().min(1).max(10000).default(100),
});

router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const parsed = createApiKeySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await createApiKey(parsed.data.partner_name, parsed.data.rate_limit);
    res.status(201).json({
      data: result.record,
      key: result.key,
      warning: 'Store this API key securely. It will not be shown again.',
    });
  } catch (err) {
    console.error('POST /api-keys error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api-keys/:keyId/revoke ─────────────────────────────────────────────

router.post('/api-keys/:keyId/revoke', async (req: Request, res: Response) => {
  try {
    await revokeApiKey(req.params.keyId);
    res.json({ data: { message: 'API key revoked successfully' } });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('POST /api-keys/:keyId/revoke error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api-keys/:keyId/rate-limit ──────────────────────────────────────────

const rateLimitSchema = z.object({
  rate_limit: z.number().int().min(1).max(10000),
});

router.put('/api-keys/:keyId/rate-limit', async (req: Request, res: Response) => {
  try {
    const parsed = rateLimitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    await updateApiKeyRateLimit(req.params.keyId, parsed.data.rate_limit);
    res.json({ data: { message: 'Rate limit updated successfully' } });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('PUT /api-keys/:keyId/rate-limit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /segments (admin-accessible list) ────────────────────────────────────

router.get('/segments', async (_req: Request, res: Response) => {
  try {
    const segments = await listSegments();
    res.json({ data: segments });
  } catch (err) {
    console.error('GET /admin/segments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/segments/:slug', async (req: Request, res: Response) => {
  try {
    const segment = await getSegmentBySlug(req.params.slug);
    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }
    const offers = await getSegmentOffers(segment.id);
    res.json({ data: { ...segment, offers } });
  } catch (err) {
    console.error('GET /admin/segments/:slug error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /segments ───────────────────────────────────────────────────────────

const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  type: z.enum(['theme', 'geography', 'partner', 'custom']),
  rules: z.record(z.any()).optional(),
  is_curated: z.boolean().optional(),
});

router.post('/segments', async (req: Request, res: Response) => {
  try {
    const parsed = createSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const createdBy = (req.headers['x-user'] as string) || 'admin';
    const segment = await createSegment({
      ...parsed.data,
      created_by: createdBy,
    });

    res.status(201).json({ data: segment });
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('POST /segments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /segments/:segmentId ─────────────────────────────────────────────────

const updateSegmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  type: z.enum(['theme', 'geography', 'partner', 'custom']).optional(),
  rules: z.record(z.any()).optional(),
  is_curated: z.boolean().optional(),
});

router.put('/segments/:segmentId', async (req: Request, res: Response) => {
  try {
    const parsed = updateSegmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const segment = await updateSegment(req.params.segmentId, parsed.data);
    res.json({ data: segment });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message?.includes('already exists')) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('PUT /segments/:segmentId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /segments/:segmentId ──────────────────────────────────────────────

router.delete('/segments/:segmentId', async (req: Request, res: Response) => {
  try {
    await deleteSegment(req.params.segmentId);
    res.json({ data: { message: 'Segment deleted successfully' } });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('DELETE /segments/:segmentId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /segments/:segmentId/offers ─────────────────────────────────────────

const addOfferSchema = z.object({
  offerId: z.string().min(1),
});

router.post('/segments/:segmentId/offers', async (req: Request, res: Response) => {
  try {
    const parsed = addOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const record = await addOfferToSegment(req.params.segmentId, parsed.data.offerId);
    res.status(201).json({ data: record });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err.message?.includes('already in')) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('POST /segments/:segmentId/offers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /segments/:segmentId/offers/:offerId ──────────────────────────────

router.delete('/segments/:segmentId/offers/:offerId', async (req: Request, res: Response) => {
  try {
    await removeOfferFromSegment(req.params.segmentId, req.params.offerId);
    res.json({ data: { message: 'Offer removed from segment' } });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('DELETE /segments/:segmentId/offers/:offerId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEED MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── POST /feed/refresh ───────────────────────────────────────────────────────

router.post('/feed/refresh', async (_req: Request, res: Response) => {
  try {
    const count = await triggerFeedRefresh();
    res.json({
      data: {
        message: 'Feed cache rebuilt successfully',
        offer_count: count,
        rebuilt_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('POST /feed/refresh error:', err);
    res.status(500).json({ error: 'Failed to rebuild feed cache' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION ROUTES (read-only — orgs are synced from FEVO)
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /organizations ──────────────────────────────────────────────────────

router.get('/organizations', async (_req: Request, res: Response) => {
  try {
    const orgs = await db('organizations').orderBy('name', 'asc');
    res.json({ data: orgs });
  } catch (err) {
    console.error('GET /organizations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /organizations/:orgId ───────────────────────────────────────────────

router.get('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const org = await db('organizations').where('id', req.params.orgId).first();
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }
    res.json({ data: org });
  } catch (err) {
    console.error('GET /organizations/:orgId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
