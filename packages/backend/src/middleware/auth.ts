import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import db from '../db/connection';

// Extend Express Request type properly
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        partner_name: string;
        rate_limit: number;
      };
    }
  }
}

/**
 * Middleware that authenticates partner requests via x-api-key header.
 * Hashes the provided key with SHA-256 and looks it up in the database.
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    // In development, allow unauthenticated feed access for widget demos
    if (process.env.NODE_ENV !== 'production') {
      next();
      return;
    }
    res.status(401).json({ error: 'Missing API key. Provide x-api-key header.' });
    return;
  }

  try {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const row = await db('api_keys')
      .where('key_hash', keyHash)
      .whereNull('revoked_at')
      .first();

    if (!row) {
      res.status(401).json({ error: 'Invalid or revoked API key.' });
      return;
    }

    req.apiKey = {
      id: row.id,
      partner_name: row.partner_name,
      rate_limit: row.rate_limit,
    };
    next();
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware that authenticates internal / admin requests via x-internal-auth header.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-auth'] as string | undefined;
  const expectedToken = process.env.INTERNAL_AUTH_TOKEN || 'internal-dev-token';

  if (!token) {
    res.status(401).json({ error: 'Unauthorized. Missing internal auth token.' });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const tokenBuf = Buffer.from(token, 'utf8');
    const expectedBuf = Buffer.from(expectedToken, 'utf8');

    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      res.status(401).json({ error: 'Unauthorized. Invalid internal auth token.' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Unauthorized. Invalid internal auth token.' });
    return;
  }

  // Warn if using default token in production
  if (expectedToken === 'internal-dev-token' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using default internal auth token in production!');
  }

  next();
}
