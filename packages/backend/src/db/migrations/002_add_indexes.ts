import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable foreign keys for SQLite
  await knex.raw('PRAGMA foreign_keys = ON');

  // Offers indexes for feed queries
  await knex.schema.alterTable('offers', (table) => {
    table.index(['status', 'distribution_enabled'], 'idx_offers_feed_eligible');
    table.index(['organization_id'], 'idx_offers_org_id');
    table.index(['date'], 'idx_offers_date');
  });

  // Kill switch indexes
  await knex.schema.alterTable('event_feed_kills', (table) => {
    table.index(['target_type', 'target_id', 'is_active'], 'idx_kills_lookup');
    table.index(['is_active'], 'idx_kills_active');
  });

  // Exclusion indexes
  await knex.schema.alterTable('feed_exclusions', (table) => {
    table.index(['offer_id'], 'idx_exclusions_offer_id');
  });

  // Segment offers index
  await knex.schema.alterTable('event_feed_segment_offers', (table) => {
    table.index(['offer_id'], 'idx_segment_offers_offer_id');
  });

  // API keys index
  await knex.schema.alterTable('api_keys', (table) => {
    table.index(['key_hash'], 'idx_api_keys_hash');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('offers', (table) => {
    table.dropIndex([], 'idx_offers_feed_eligible');
    table.dropIndex([], 'idx_offers_org_id');
    table.dropIndex([], 'idx_offers_date');
  });
  await knex.schema.alterTable('event_feed_kills', (table) => {
    table.dropIndex([], 'idx_kills_lookup');
    table.dropIndex([], 'idx_kills_active');
  });
  await knex.schema.alterTable('feed_exclusions', (table) => {
    table.dropIndex([], 'idx_exclusions_offer_id');
  });
  await knex.schema.alterTable('event_feed_segment_offers', (table) => {
    table.dropIndex([], 'idx_segment_offers_offer_id');
  });
  await knex.schema.alterTable('api_keys', (table) => {
    table.dropIndex([], 'idx_api_keys_hash');
  });
}
