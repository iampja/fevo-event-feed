import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { ApiKey } from '../models/types';

function generateApiKey(): string {
  const prefix = 'efeed_';
  const random = crypto.randomBytes(24).toString('base64url');
  return `${prefix}${random}`;
}

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Create a new API key for a partner.
 * Returns the raw key (shown once) and the database record.
 */
export async function createApiKey(
  partnerName: string,
  rateLimit: number = 100
): Promise<{ key: string; record: Omit<ApiKey, 'key_hash'> }> {
  const rawKey = generateApiKey();
  const record: ApiKey = {
    id: uuidv4(),
    key_hash: hashKey(rawKey),
    partner_name: partnerName,
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: rateLimit,
  };

  await db('api_keys').insert(record);

  const { key_hash, ...safeRecord } = record;
  return { key: rawKey, record: safeRecord };
}

/**
 * List all API keys (without hashes for security).
 */
export async function listApiKeys(): Promise<Array<Omit<ApiKey, 'key_hash'>>> {
  return db('api_keys')
    .select('id', 'partner_name', 'created_at', 'revoked_at', 'rate_limit')
    .orderBy('created_at', 'desc');
}

/**
 * Revoke an API key by setting the revoked_at timestamp.
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  const updated = await db('api_keys')
    .where('id', keyId)
    .whereNull('revoked_at')
    .update({ revoked_at: new Date().toISOString() });

  if (updated === 0) {
    throw new Error(`API key not found or already revoked: ${keyId}`);
  }
}

/**
 * Update the rate limit for an API key.
 */
export async function updateApiKeyRateLimit(keyId: string, rateLimit: number): Promise<void> {
  const updated = await db('api_keys')
    .where('id', keyId)
    .whereNull('revoked_at')
    .update({ rate_limit: rateLimit });

  if (updated === 0) {
    throw new Error(`API key not found or revoked: ${keyId}`);
  }
}
