import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  syncOrganizationOffers,
  syncAllOrganizations,
  getSyncLogs,
} from '../services/fevoSyncService';

const router = Router();

// ── POST /sync/organization/:orgId — trigger sync for a single org ──────────

router.post('/sync/organization/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const result = await syncOrganizationOffers(orgId);
    res.json({ data: result });
  } catch (err: any) {
    console.error('POST /sync/organization/:orgId error:', err);
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Sync failed', message: err.message });
  }
});

// ── POST /sync/all — sync all configured organizations ──────────────────────

router.post('/sync/all', async (_req: Request, res: Response) => {
  try {
    const results = await syncAllOrganizations();
    res.json({
      data: results,
      meta: {
        organizations_synced: results.length,
        total_created: results.reduce((sum, r) => sum + r.offers_created, 0),
        total_updated: results.reduce((sum, r) => sum + r.offers_updated, 0),
      },
    });
  } catch (err: any) {
    console.error('POST /sync/all error:', err);
    res.status(500).json({ error: 'Sync failed', message: err.message });
  }
});

// ── GET /sync/status — auto-sync status ─────────────────────────────────────

router.get('/sync/status', async (_req: Request, res: Response) => {
  try {
    // Get the most recent sync log for last-sync info
    const lastSync = await getSyncLogs(1);
    const last = lastSync[0] || null;
    res.json({
      autoSync: true,
      intervalSeconds: 900,
      lastSync: last ? {
        started_at: last.started_at,
        completed_at: last.completed_at,
        status: last.status,
        offers_created: last.offers_created,
        offers_updated: last.offers_updated,
        errors: last.errors,
      } : null,
    });
  } catch {
    res.json({ autoSync: true, intervalSeconds: 900, lastSync: null });
  }
});

// ── GET /sync/log — list recent sync operations ─────────────────────────────

const syncLogSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

router.get('/sync/log', async (req: Request, res: Response) => {
  try {
    const parsed = syncLogSchema.safeParse(req.query);
    const limit = parsed.success ? parsed.data.limit : 50;
    const logs = await getSyncLogs(limit);
    res.json({ data: logs });
  } catch (err) {
    console.error('GET /sync/log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
