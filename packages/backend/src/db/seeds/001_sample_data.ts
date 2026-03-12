import { Knex } from 'knex';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const API_KEY_RAW = 'efeed_test_key_abc123';

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Seed file: ensures the test API key exists.
 * Does NOT delete existing data — offer/org/venue data comes from FEVO sync.
 */
export async function seed(knex: Knex): Promise<void> {
  const keyHash = hashKey(API_KEY_RAW);

  // Only insert the API key if it doesn't already exist
  const existing = await knex('api_keys').where('key_hash', keyHash).first();
  if (!existing) {
    await knex('api_keys').insert({
      id: uuidv4(),
      key_hash: keyHash,
      partner_name: 'Test Partner',
      created_at: new Date().toISOString(),
      revoked_at: null,
      rate_limit: 100,
    });
    console.log('Seeded test API key');
  }
}
