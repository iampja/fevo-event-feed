import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { internalAuth } from '../middleware/auth';
import { adminRateLimiter } from '../middleware/rateLimit';
import {
  killOffer,
  killOrganization,
  restoreKill,
  getActiveKills,
} from '../services/killService';
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
  createSegment,
  updateSegment,
  deleteSegment,
  addOfferToSegment,
  removeOfferFromSegment,
} from '../services/segmentService';
import {
  listRewards,
  getRewardByOfferId,
  createReward,
  updateReward,
  deleteReward,
} from '../services/rewardService';
import { listOffers, getOfferById, getOfferStats } from '../services/offerService';
import { triggerFeedRefresh } from '../jobs/feedRefresh';
import db from '../db/connection';

const router = Router();

// All admin routes require internal auth
router.use(internalAuth);
router.use(adminRateLimiter);

// ═══════════════════════════════════════════════════════════════════════════════
// KILL SWITCH ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /kills ───────────────────────────────────────────────────────────────

router.get('/kills', async (_req: Request, res: Response) => {
  try {
    const kills = await getActiveKills();
    res.json({ data: kills });
  } catch (err) {
    console.error('GET /kills error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /kills/offer ────────────────────────────────────────────────────────

const killOfferSchema = z.object({
  offerId: z.string().min(1),
  reason: z.string().optional(),
});

router.post('/kills/offer', async (req: Request, res: Response) => {
  try {
    const parsed = killOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { offerId, reason } = parsed.data;
    const killedBy = (req.headers['x-user'] as string) || 'admin';
    const kill = await killOffer(offerId, killedBy, reason);

    res.status(201).json({ data: kill });
  } catch (err: any) {
    if (err.message?.startsWith('Offer not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('POST /kills/offer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /kills/organization ─────────────────────────────────────────────────

const killOrgSchema = z.object({
  orgId: z.string().min(1),
  reason: z.string().min(1),
});

router.post('/kills/organization', async (req: Request, res: Response) => {
  try {
    const parsed = killOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { orgId, reason } = parsed.data;
    const killedBy = (req.headers['x-user'] as string) || 'admin';
    const kill = await killOrganization(orgId, killedBy, reason);

    res.status(201).json({ data: kill });
  } catch (err: any) {
    if (err.message?.startsWith('No offers found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('POST /kills/organization error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /kills/:killId/restore ──────────────────────────────────────────────

router.post('/kills/:killId/restore', async (req: Request, res: Response) => {
  try {
    const restoredBy = (req.headers['x-user'] as string) || 'admin';
    const kill = await restoreKill(req.params.killId, restoredBy);

    if (!kill) {
      res.status(404).json({ error: 'Kill record not found' });
      return;
    }

    res.json({ data: kill });
  } catch (err: any) {
    if (err.message?.includes('already restored')) {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('POST /kills/:killId/restore error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
// OFFER UPDATE ROUTE (enrichment for synced offers)
// ═══════════════════════════════════════════════════════════════════════════════

const updateOfferSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  price_min: z.number().min(0).nullable().optional(),
  price_max: z.number().min(0).nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
  date: z.string().nullable().optional(),
  venue_name: z.string().max(255).nullable().optional(),
  venue_city: z.string().max(255).nullable().optional(),
  venue_state: z.string().max(50).nullable().optional(),
  availability: z.enum(['available', 'limited', 'sold_out']).optional(),
  checkout_url: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  tickets_available: z.number().int().min(0).nullable().optional(),
});

router.put('/offers/:offerId', async (req: Request, res: Response) => {
  try {
    const parsed = updateOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const offer = await getOfferById(req.params.offerId);
    if (!offer) {
      res.status(404).json({ error: 'Offer not found' });
      return;
    }

    const updates: Record<string, any> = { ...parsed.data, updated_at: new Date().toISOString() };

    // Serialize tags array to JSON string if provided
    if (updates.tags !== undefined) {
      updates.tags = updates.tags ? JSON.stringify(updates.tags) : null;
    }

    // Update is_sold_out based on availability
    if (updates.availability === 'sold_out') {
      updates.is_sold_out = true;
    } else if (updates.availability) {
      updates.is_sold_out = false;
    }

    await db('offers').where('id', req.params.offerId).update(updates);
    const updated = await getOfferById(req.params.offerId);

    res.json({ data: updated });
  } catch (err) {
    console.error('PUT /offers/:offerId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REWARD PROGRAM ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /rewards ────────────────────────────────────────────────────────────

router.get('/rewards', async (_req: Request, res: Response) => {
  try {
    const rewards = await listRewards();
    res.json({ data: rewards });
  } catch (err) {
    console.error('GET /rewards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /offers/:offerId/reward ─────────────────────────────────────────────

router.get('/offers/:offerId/reward', async (req: Request, res: Response) => {
  try {
    const reward = await getRewardByOfferId(req.params.offerId);
    if (!reward) {
      res.status(404).json({ error: 'No reward program found for this offer' });
      return;
    }
    res.json({ data: reward });
  } catch (err) {
    console.error('GET /offers/:offerId/reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /offers/:offerId/reward ────────────────────────────────────────────

const milestoneSchema = z.object({
  tier: z.number().int().min(1),
  threshold: z.number().int().min(1),
  label: z.string().min(1).max(100),
  reward: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  image_url: z.string().url().optional(),
});

const createRewardSchema = z.object({
  type: z.enum(['money', 'points', 'discount', 'merchandise', 'custom']),
  headline: z.string().min(1).max(255),
  rule: z.object({
    amount: z.number().min(0),
    unit: z.string().min(1),
    per: z.string().min(1),
  }),
  milestones: z.array(milestoneSchema).min(1).max(10),
});

router.post('/offers/:offerId/reward', async (req: Request, res: Response) => {
  try {
    const parsed = createRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const reward = await createReward({
      offer_id: req.params.offerId,
      ...parsed.data,
    });

    res.status(201).json({ data: reward });
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('POST /offers/:offerId/reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /offers/:offerId/reward ─────────────────────────────────────────────

const updateRewardSchema = z.object({
  type: z.enum(['money', 'points', 'discount', 'merchandise', 'custom']).optional(),
  headline: z.string().min(1).max(255).optional(),
  rule: z.object({
    amount: z.number().min(0),
    unit: z.string().min(1),
    per: z.string().min(1),
  }).optional(),
  milestones: z.array(milestoneSchema).min(1).max(10).optional(),
});

router.put('/offers/:offerId/reward', async (req: Request, res: Response) => {
  try {
    const parsed = updateRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const reward = await updateReward(req.params.offerId, parsed.data);
    res.json({ data: reward });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('PUT /offers/:offerId/reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /offers/:offerId/reward ──────────────────────────────────────────

router.delete('/offers/:offerId/reward', async (req: Request, res: Response) => {
  try {
    await deleteReward(req.params.offerId);
    res.json({ data: { message: 'Reward program deleted successfully' } });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('DELETE /offers/:offerId/reward error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION CRUD ROUTES
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

// ── POST /organizations ─────────────────────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(1).max(255),
  logo_url: z.string().url().nullable().optional(),
  fevo_org_id: z.string().nullable().optional(),
});

router.post('/organizations', async (req: Request, res: Response) => {
  try {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const now = new Date().toISOString();
    const org = {
      id: uuidv4(),
      name: parsed.data.name,
      logo_url: parsed.data.logo_url || null,
      fevo_org_id: parsed.data.fevo_org_id || null,
      created_at: now,
      updated_at: now,
    };

    await db('organizations').insert(org);
    res.status(201).json({ data: org });
  } catch (err) {
    console.error('POST /organizations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /organizations/:orgId ───────────────────────────────────────────────

const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().nullable().optional(),
  fevo_org_id: z.string().nullable().optional(),
});

router.put('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const parsed = updateOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const existing = await db('organizations').where('id', req.params.orgId).first();
    if (!existing) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    await db('organizations').where('id', req.params.orgId).update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    });

    const updated = await db('organizations').where('id', req.params.orgId).first();
    res.json({ data: updated });
  } catch (err) {
    console.error('PUT /organizations/:orgId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /organizations/:orgId ────────────────────────────────────────────

router.delete('/organizations/:orgId', async (req: Request, res: Response) => {
  try {
    const existing = await db('organizations').where('id', req.params.orgId).first();
    if (!existing) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    await db('organizations').where('id', req.params.orgId).del();
    res.json({ data: { message: 'Organization deleted successfully' } });
  } catch (err) {
    console.error('DELETE /organizations/:orgId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
