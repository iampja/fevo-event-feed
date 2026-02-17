import { Router } from 'express';
import feedRoutes from './feedRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Public / partner-facing feed endpoints
router.use('/', feedRoutes);

// Internal admin endpoints
router.use('/admin', adminRoutes);

export default router;
