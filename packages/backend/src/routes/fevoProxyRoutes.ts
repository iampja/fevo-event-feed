/**
 * FEVO Proxy Routes
 *
 * Express router that proxies requests to the FEVO manage API via FevoOfferService.
 * All routes require internalAuth middleware.
 * The /offers/launch endpoint uses SSE to stream progress events.
 */

import { Router, Request, Response } from 'express';
import { getFevoOfferService, LaunchOfferParams } from '../services/fevoOfferService';

const router = Router();

// ── Helper ───────────────────────────────────────────────────────────────────

function getService(res: Response) {
  const service = getFevoOfferService();
  if (!service) {
    res.status(503).json({
      error: 'FEVO API not configured',
      detail: 'Missing FEVO_API_BASE_URL or credentials',
    });
    return null;
  }
  return service;
}

// ── Read endpoints ───────────────────────────────────────────────────────────

/**
 * GET /organizations
 * Query params: filter, skip, take
 */
router.get('/organizations', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const { filter, skip, take } = req.query;
    const data = await service.listOrganizations(
      filter as string | undefined,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] listOrganizations error:', err.message);
    res.status(502).json({ error: 'Failed to fetch organizations', detail: err.message });
  }
});

/**
 * GET /organizations/:orgId/settings
 */
router.get('/organizations/:orgId/settings', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.getOrgSettings(req.params.orgId);
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] getOrgSettings error:', err.message);
    res.status(502).json({ error: 'Failed to fetch org settings', detail: err.message });
  }
});

/**
 * GET /organizations/:orgId/vendor-agreements
 */
router.get('/organizations/:orgId/vendor-agreements', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.getVendorAgreements(req.params.orgId);
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] getVendorAgreements error:', err.message);
    res.status(502).json({ error: 'Failed to fetch vendor agreements', detail: err.message });
  }
});

/**
 * GET /organizations/:orgId/events
 * Query params: query, fromDate, toDate, page, pageSize
 */
router.get('/organizations/:orgId/events', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const { query, fromDate, toDate, page, pageSize } = req.query;
    const data = await service.searchEvents(
      req.params.orgId,
      query as string | undefined,
      fromDate as string | undefined,
      toDate as string | undefined,
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
    );
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] searchEvents error:', err.message);
    res.status(502).json({ error: 'Failed to search events', detail: err.message });
  }
});

/**
 * GET /events/:eventId/manifest
 * Query params: saleType
 */
router.get('/events/:eventId/manifest', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.getManifest(
      req.params.eventId,
      req.query.saleType as string | undefined,
    );
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] getManifest error:', err.message);
    res.status(502).json({ error: 'Failed to fetch manifest', detail: err.message });
  }
});

/**
 * GET /events/:eventId/offers
 */
router.get('/events/:eventId/offers', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.listEventOffers(req.params.eventId);
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] listEventOffers error:', err.message);
    res.status(502).json({ error: 'Failed to fetch event offers', detail: err.message });
  }
});

/**
 * GET /organizations/:orgId/groups
 * Query params: filter
 */
router.get('/organizations/:orgId/groups', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.listGroups(
      req.params.orgId,
      req.query.filter as string | undefined,
    );
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] listGroups error:', err.message);
    res.status(502).json({ error: 'Failed to fetch groups', detail: err.message });
  }
});

/**
 * GET /groups/:groupId
 */
router.get('/groups/:groupId', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  try {
    const data = await service.getGroupOverview(req.params.groupId);
    res.json(data);
  } catch (err: any) {
    console.error('[fevoProxy] getGroupOverview error:', err.message);
    res.status(502).json({ error: 'Failed to fetch group', detail: err.message });
  }
});

// ── SSE Launch endpoint ──────────────────────────────────────────────────────

/**
 * POST /offers/launch
 * Body: { orgId, eventId, title, description, accessCode, hasGroups }
 *
 * Streams SSE progress events during the orchestrated offer creation flow.
 */
router.post('/offers/launch', async (req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  const { orgId, eventId, title, description, accessCode, hasGroups } = req.body;

  // Validate required fields
  if (!orgId || !eventId || !title || !accessCode) {
    res.status(400).json({
      error: 'Missing required fields',
      detail: 'orgId, eventId, title, and accessCode are required',
    });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (step: string, detail?: string, result?: any) => {
    const payload: any = { step };
    if (detail) payload.detail = detail;
    if (result) payload.result = result;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Handle client disconnect
  let aborted = false;
  req.on('close', () => {
    aborted = true;
  });

  const params: LaunchOfferParams = {
    orgId,
    eventId,
    title,
    description: description || '',
    accessCode,
    hasGroups: !!hasGroups,
  };

  try {
    const result = await service.launchOffer(params, (step, detail) => {
      if (!aborted) {
        sendEvent(step, detail);
      }
    });

    if (!aborted) {
      sendEvent('done', undefined, result);
    }
  } catch (err: any) {
    console.error('[fevoProxy] launchOffer error:', err.message);
    if (!aborted) {
      sendEvent('error', err.message);
    }
  } finally {
    if (!aborted) {
      res.end();
    }
  }
});

export default router;
