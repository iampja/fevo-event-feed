import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import routes from './routes';
import db from './db/connection';
import { startFeedRefreshJob, stopFeedRefreshJob } from './jobs/feedRefresh';
import { startAutoSyncJob, stopAutoSyncJob } from './jobs/autoSync';
import { buildFeedIndex } from './services/feedService';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Global middleware ────────────────────────────────────────────────────────

app.use(cors());
app.use(helmet());
app.use(express.json());

// ── Request logging ──────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    if (res.statusCode >= 400) {
      console.error(log);
    } else if (req.originalUrl !== '/health') {
      // Skip health check spam in logs
      console.log(log);
    }
  });
  next();
});

// ── Health check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    service: 'FEVO Event Feed API',
    status: 'ok',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      event_feed: '/api/v1/event-feed',
      segments: '/api/v1/event-feed/segments',
      fevo_proxy: '/api/v1/event-feed/fevo',
      docs: '/docs',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Swagger UI ───────────────────────────────────────────────────────────
// Disable helmet CSP on /docs so Swagger UI inline scripts/styles load

try {
  const specPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
  const specFile = fs.readFileSync(specPath, 'utf8');
  const swaggerDoc = yaml.load(specFile) as Record<string, unknown>;
  app.use(
    '/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerDoc, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FEVO Event Feed API Docs',
    }),
  );
} catch (err) {
  console.warn('Swagger UI not loaded (docs/openapi.yaml not found)');
}

// ── Mount API routes ─────────────────────────────────────────────────────────

app.use('/api/v1/event-feed', routes);

// ── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    // Run migrations
    await db.migrate.latest();
    console.log('Database migrations complete');

    // Run seeds if tables are empty (first boot) or RESEED is set
    const forceReseed = process.env.RESEED === 'true';
    const offerCount = await db('offers').count('id as count').first();
    if (forceReseed || (offerCount && Number(offerCount.count) === 0)) {
      await db.seed.run();
      console.log(forceReseed ? 'Database reseeded (RESEED=true)' : 'Database seeded with sample data');
    }

    // Mark any stuck "running" syncs as failed (from prior crash/restart)
    await db('sync_log').where('status', 'running').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      errors: JSON.stringify(['Interrupted by server restart']),
    });

    // Build initial feed index
    const feedCount = await buildFeedIndex();
    console.log(`Initial feed index built with ${feedCount} offers`);

    // Start cron jobs
    startFeedRefreshJob();
    startAutoSyncJob();

    // Run initial sync if no offers exist yet (first boot)
    if (offerCount && Number(offerCount.count) === 0) {
      const { syncAllOrganizations } = await import('./services/fevoSyncService');
      const { getFevoApiClient } = await import('./services/fevoApiClient');
      const client = getFevoApiClient();
      if (client.isConfigured()) {
        console.log('[bootstrap] No offers found — triggering initial FEVO sync...');
        syncAllOrganizations().then(async (results) => {
          const created = results.reduce((sum, r) => sum + r.offers_created, 0);
          const updated = results.reduce((sum, r) => sum + r.offers_updated, 0);
          console.log(`[bootstrap] Initial sync complete: ${results.length} orgs, ${created} created, ${updated} updated`);
          const count = await buildFeedIndex();
          console.log(`[bootstrap] Feed index rebuilt with ${count} offers`);
        }).catch((err) => {
          console.error('[bootstrap] Initial sync failed:', err);
        });
      }
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Event Feed API listening on http://localhost:${PORT}`);
      console.log(`  Feed endpoint: http://localhost:${PORT}/api/v1/event-feed`);
      console.log(`  Admin endpoint: http://localhost:${PORT}/api/v1/event-feed/admin`);
    });
  } catch (err) {
    console.error('Failed to bootstrap server:', err);
    process.exit(1);
  }
}

// Only auto-start when this file is the entry point (not when imported for tests)
if (require.main === module) {
  bootstrap().then(() => {
    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      try {
        stopFeedRefreshJob();
        stopAutoSyncJob();
        await db.destroy();
        console.log('Database connection closed. Goodbye.');
      } catch (err) {
        console.error('Error during shutdown:', err);
      }
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

export { app, bootstrap };
export default app;
