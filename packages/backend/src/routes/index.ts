import { Router } from 'express';
import feedRoutes from './feedRoutes';
import adminRoutes from './adminRoutes';
import syncRoutes from './syncRoutes';
import webhookRoutes from './webhookRoutes';
import fevoProxyRoutes from './fevoProxyRoutes';
import { internalAuth } from '../middleware/auth';
import { adminRateLimiter } from '../middleware/rateLimit';

const router = Router();

// Public / partner-facing feed endpoints
router.use('/', feedRoutes);

// Internal admin endpoints
router.use('/admin', adminRoutes);

// Sync routes (admin-only)
router.use('/admin', internalAuth, adminRateLimiter, syncRoutes);

// Webhook endpoints (public, validated by secret)
router.use('/webhooks', webhookRoutes);

// FEVO proxy routes (AI agent — no auth for POC)
router.use('/fevo', fevoProxyRoutes);

export default router;
