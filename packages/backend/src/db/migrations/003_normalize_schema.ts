import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── organizations ──────────────────────────────────────────────────────────
  await knex.schema.createTable('organizations', (t) => {
    t.text('id').primary();
    t.text('name').notNullable();
    t.text('logo_url');
    t.text('fevo_org_id');
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── venues ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('venues', (t) => {
    t.text('id').primary();
    t.text('name').notNullable();
    t.text('city');
    t.text('state');
    t.text('country').defaultTo('US');
    t.text('timezone');
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── events ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('events', (t) => {
    t.text('id').primary();
    t.text('title').notNullable();
    t.text('fevo_event_id');
    t.text('organization_id').references('id').inTable('organizations');
    t.text('venue_id').references('id').inTable('venues');
    t.text('date_utc');
    t.text('date_timezone');
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── sync_log ───────────────────────────────────────────────────────────────
  await knex.schema.createTable('sync_log', (t) => {
    t.text('id').primary();
    t.text('sync_type').notNullable(); // 'organization' | 'all'
    t.text('organization_id');
    t.text('started_at').notNullable();
    t.text('completed_at');
    t.integer('offers_created').defaultTo(0);
    t.integer('offers_updated').defaultTo(0);
    t.text('errors'); // JSON array of error strings
    t.text('status').defaultTo('running'); // 'running' | 'completed' | 'failed'
  });

  // ── add new columns to offers (additive only) ─────────────────────────────
  await knex.schema.alterTable('offers', (t) => {
    t.text('fevo_offer_id');
    t.text('fevo_url_code');
    t.text('event_id').references('id').inTable('events');
    t.text('venue_id').references('id').inTable('venues');
    t.text('video_url');
    t.integer('tickets_available');
    t.boolean('is_sold_out').defaultTo(false);
    t.text('source').defaultTo('manual'); // 'manual' | 'fevo_sync' | 'fevo_webhook'
    t.text('fevo_synced_at');
  });

  // ── indexes for new tables ─────────────────────────────────────────────────
  await knex.schema.alterTable('organizations', (t) => {
    t.index(['fevo_org_id'], 'idx_organizations_fevo_org_id');
  });

  await knex.schema.alterTable('events', (t) => {
    t.index(['fevo_event_id'], 'idx_events_fevo_event_id');
    t.index(['organization_id'], 'idx_events_org_id');
    t.index(['venue_id'], 'idx_events_venue_id');
  });

  await knex.schema.alterTable('offers', (t) => {
    t.index(['fevo_offer_id'], 'idx_offers_fevo_offer_id');
    t.index(['event_id'], 'idx_offers_event_id');
    t.index(['venue_id'], 'idx_offers_venue_id');
    t.index(['source'], 'idx_offers_source');
  });

  await knex.schema.alterTable('sync_log', (t) => {
    t.index(['organization_id'], 'idx_sync_log_org_id');
    t.index(['status'], 'idx_sync_log_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop indexes on offers
  await knex.schema.alterTable('offers', (t) => {
    t.dropIndex([], 'idx_offers_fevo_offer_id');
    t.dropIndex([], 'idx_offers_event_id');
    t.dropIndex([], 'idx_offers_venue_id');
    t.dropIndex([], 'idx_offers_source');
  });

  // Remove new columns from offers
  await knex.schema.alterTable('offers', (t) => {
    t.dropColumn('fevo_offer_id');
    t.dropColumn('fevo_url_code');
    t.dropColumn('event_id');
    t.dropColumn('venue_id');
    t.dropColumn('video_url');
    t.dropColumn('tickets_available');
    t.dropColumn('is_sold_out');
    t.dropColumn('source');
    t.dropColumn('fevo_synced_at');
  });

  // Drop new tables in reverse dependency order
  await knex.schema.dropTableIfExists('sync_log');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('venues');
  await knex.schema.dropTableIfExists('organizations');
}
