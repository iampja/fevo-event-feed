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

  // Keepalive every 10s so Render doesn't kill the connection
  const keepalive = setInterval(() => {
    if (!aborted) res.write(': keepalive\n\n');
  }, 10_000);

  // Handle client disconnect
  let aborted = false;
  req.on('close', () => {
    aborted = true;
    clearInterval(keepalive);
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
    // Inline the launch flow (calling service.launchOffer() hangs for unknown reasons,
    // but calling service methods directly from the route handler works fine)
    sendEvent('loading_org', 'Loading organization settings...');
    const orgSettings = await service.getOrgSettings(params.orgId);
    sendEvent('org_loaded', `Org: ${orgSettings?.name || 'OK'}`);

    sendEvent('loading_vas', 'Loading vendor agreements...');
    const vendorAgreements = await service.getVendorAgreements(params.orgId);
    sendEvent('vas_loaded', `VAs: ${Array.isArray(vendorAgreements) ? vendorAgreements.length : 0}`);

    sendEvent('loading_manifest', 'Loading event manifest...');
    let manifest: any = { areas: [], holds: [] };
    try { manifest = await service.getManifest(params.eventId); } catch { /* non-fatal */ }
    sendEvent('manifest_loaded', `Manifest: ${manifest?.areas?.length || 0} areas`);

    sendEvent('loading_event', 'Loading event details...');
    const eventsResult = await service.searchEvents(params.orgId);
    const events = eventsResult?.overviews || [];
    const eventInfo = events.find((e: any) => e.id === params.eventId) || events[0];
    sendEvent('event_loaded', eventInfo ? `Event: ${eventInfo.title || eventInfo.venue?.name || params.eventId}` : 'Event loaded');

    sendEvent('loading_template', 'Looking for template offer...');
    let templateOffer: any = null;
    try {
      const eventOffers = await service.listEventOffers(params.eventId);
      const offerList = Array.isArray(eventOffers) ? eventOffers : [];
      if (offerList.length > 0) {
        templateOffer = await service.getOfferDetails(offerList[0].id);
      }
    } catch { /* non-fatal */ }
    sendEvent('template_loaded', templateOffer ? `Template: ${templateOffer.title}` : 'No template');

    // Build and create offer
    sendEvent('creating_offer', 'Creating offer in FEVO...');
    const { randomUUID } = await import('crypto');
    const outingId = randomUUID();
    const offerPayload = service.buildOfferPayloadPublic({
      outingId,
      eventId: params.eventId,
      orgId: params.orgId,
      title: params.title,
      description: params.description,
      accessCode: params.accessCode,
      orgSettings,
      vendorAgreements: vendorAgreements || [],
      manifest,
      group: null,
      eventInfo,
      templateOffer,
    });
    await service.createOffer(offerPayload);
    sendEvent('offer_created', 'Offer creation initiated');

    // Poll for completion
    sendEvent('polling', 'Waiting for offer to be ready...');
    let pollSuccess = false;
    let pollMessage: string | null = null;
    for (let attempt = 1; attempt <= 40; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const poll = await service.pollOfferComplete();
        if (poll.success) {
          pollSuccess = true;
          pollMessage = poll.message;
          break;
        }
        if (!aborted) sendEvent('polling', `Attempt ${attempt}/40...`);
      } catch { /* retry */ }
    }

    if (!pollSuccess) throw new Error('Offer creation timed out');
    if (pollMessage) throw new Error(`Offer creation error: ${pollMessage}`);
    sendEvent('offer_complete', 'Offer created successfully');

    // Item library (if manifest has areas)
    let itemLibraryId: string | null = null;
    if (manifest?.areas?.length > 0) {
      try {
        sendEvent('creating_item_library', 'Setting up inventory...');
        const itemPayload = service.buildItemLibraryPayloadPublic(manifest, orgSettings, vendorAgreements, null);
        const step1 = await service.createItemLibrary(outingId, itemPayload);
        itemLibraryId = step1?.id;
        const returnedItems = step1?.items || [];
        if (itemLibraryId && returnedItems.length > 0) {
          const upsertPayload = service.buildItemLibraryUpsertPayloadPublic(itemPayload, itemLibraryId, returnedItems);
          await service.createItemLibrary(outingId, upsertPayload);
        }
      } catch { /* non-fatal */ }
    }

    // Link item library
    if (itemLibraryId) {
      try {
        sendEvent('linking', 'Linking inventory to offer...');
        await service.linkItemToOffer(outingId, itemLibraryId);
      } catch { /* non-fatal */ }
    }

    const manageUrl = `https://dev.gofevo.com/manage/outing/${outingId}`;
    if (!aborted) {
      sendEvent('done', undefined, { outingId, accessCode: params.accessCode, manageUrl });
    }
  } catch (err: any) {
    console.error('[fevoProxy] launchOffer error:', err.message);
    if (!aborted) {
      sendEvent('error', err.message);
    }
  } finally {
    clearInterval(keepalive);
    if (!aborted) {
      res.end();
    }
  }
});

/**
 * GET /debug
 * Test FEVO API connectivity — checks auth, org, events, manifest
 */
router.get('/debug', async (_req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  const results: Record<string, any> = {};

  try {
    results.orgs = { status: 'testing...' };
    const orgs = await service.listOrganizations();
    const orgList = orgs?.overviews || [];
    results.orgs = { status: 'ok', count: orgList.length, first: orgList[0]?.name };

    if (orgList.length > 0) {
      const orgId = orgList[0].id;
      const orgName = orgList[0].name;

      results.orgSettings = { status: 'testing...' };
      try {
        const settings = await service.getOrgSettings(orgId);
        results.orgSettings = { status: 'ok', orgName, hasDeliveries: !!settings?.deliveries_default };
      } catch (err: any) {
        results.orgSettings = { status: 'error', error: err.message };
      }

      results.vendorAgreements = { status: 'testing...' };
      try {
        const vas = await service.getVendorAgreements(orgId);
        results.vendorAgreements = { status: 'ok', count: Array.isArray(vas) ? vas.length : 'not-array', type: typeof vas };
      } catch (err: any) {
        results.vendorAgreements = { status: 'error', error: err.message };
      }

      // Raw event overview structure for debugging
      results.rawEventSample = { status: 'testing...' };
      try {
        const rawResult = await service.getRawEventOverviews();
        const rawList = rawResult?.overviews || [];
        results.rawEventSample = {
          status: 'ok',
          totalFromApi: rawList.length,
          firstKeys: rawList[0] ? Object.keys(rawList[0]) : [],
          firstOrgField: rawList[0]?.organization || rawList[0]?.org || 'none',
          firstOrgId: rawList[0]?.organization?.id || rawList[0]?.org?.id || rawList[0]?.organization_id || 'none',
          firstTitle: rawList[0]?.title || rawList[0]?.name || 'none',
        };
      } catch (err: any) {
        results.rawEventSample = { status: 'error', error: err.message };
      }

      results.events = { status: 'testing...' };
      try {
        const events = await service.searchEvents(orgId);
        const evList = events?.overviews || [];
        results.events = {
          status: 'ok',
          count: evList.length,
          first: evList[0] ? { id: evList[0].id, title: evList[0].title } : null,
        };

        if (evList.length > 0) {
          results.manifest = { status: 'testing...' };
          try {
            const manifest = await service.getManifest(evList[0].id);
            results.manifest = {
              status: 'ok',
              areas: manifest?.areas?.length ?? 0,
              holds: manifest?.holds?.length ?? 0,
            };
          } catch (err: any) {
            results.manifest = { status: 'error', error: err.message };
          }
        }
      } catch (err: any) {
        results.events = { status: 'error', error: err.message };
      }
    }
  } catch (err: any) {
    results.orgs = { status: 'error', error: err.message };
  }

  res.json(results);
});

/**
 * GET /version
 * Returns the deployed code version for debugging deploy issues
 */
router.get('/version', (_req: Request, res: Response) => {
  res.json({ version: '2026-03-19-v15-inline-launch', ts: Date.now() });
});

/**
 * GET /test-sse-mcp
 * Test MCP call from within an SSE response context (to debug launch hang)
 */
router.get('/test-sse-mcp', async (_req: Request, res: Response) => {
  const service = getService(res);
  if (!service) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ step: 'start', detail: 'Testing MCP from SSE context...' })}\n\n`);

  try {
    const orgs = await service.listOrganizations();
    const count = orgs?.overviews?.length || 0;
    res.write(`data: ${JSON.stringify({ step: 'orgs', detail: `Found ${count} orgs` })}\n\n`);

    if (count > 0) {
      const orgId = orgs.overviews[0].id;
      const settings = await service.getOrgSettings(orgId);
      res.write(`data: ${JSON.stringify({ step: 'settings', detail: `Got settings for ${settings?.name || orgId}` })}\n\n`);

      const vas = await service.getVendorAgreements(orgId);
      const vaCount = Array.isArray(vas) ? vas.length : 0;
      res.write(`data: ${JSON.stringify({ step: 'vas', detail: `Got ${vaCount} vendor agreements` })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ step: 'done', detail: 'All MCP calls succeeded in SSE context!' })}\n\n`);
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ step: 'error', detail: err.message })}\n\n`);
  }

  res.end();
});

export default router;
