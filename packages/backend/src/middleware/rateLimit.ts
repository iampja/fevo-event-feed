import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Default rate limiter: 100 requests per minute per IP.
 */
export const defaultRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req: Request): string => {
    // If the request was authed with an API key, use that as the bucket.
    const apiKey = (req as any).apiKey;
    if (apiKey) {
      return `apikey:${apiKey.id}`;
    }
    return req.ip || 'unknown';
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

/**
 * Strict rate limiter for admin endpoints: 30 requests per minute.
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});
