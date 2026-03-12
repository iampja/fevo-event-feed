import { Knex } from 'knex';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const API_KEY_RAW = 'efeed_test_key_abc123';

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Seed file: creates only the test API key.
 * Offer/org/venue data comes from FEVO API sync, not seed data.
 */
export async function seed(knex: Knex): Promise<void> {
  // Clean tables in dependency order
  await knex('event_feed_segment_offers').del();
  await knex('event_feed_segments').del();
  await knex('feed_exclusions').del();
  await knex('feed_cache').del();
  await knex('api_keys').del();
  await knex('sync_log').del();
  await knex('offers').del();
  await knex('events').del();
  await knex('venues').del();
  await knex('organizations').del();

  // Insert sample API key for dev/test
  await knex('api_keys').insert({
    id: uuidv4(),
    key_hash: hashKey(API_KEY_RAW),
    partner_name: 'Test Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 100,
  });
}
