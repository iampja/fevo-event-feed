import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── offers ─────────────────────────────────────────────────────────────────
  await knex.schema.createTable('offers', (t) => {
    t.text('id').primary();
    t.text('title').notNullable();
    t.text('description');
    t.text('image_url');
    t.float('price_min');
    t.float('price_max');
    t.text('currency').defaultTo('USD');
    t.text('date'); // ISO datetime
    t.text('venue_name');
    t.text('venue_city');
    t.text('venue_state');
    t.text('availability').defaultTo('available');
    t.text('organization_id');
    t.text('organization_name');
    t.text('checkout_url');
    t.text('tags'); // JSON array as string
    t.text('status').defaultTo('active');
    t.boolean('distribution_enabled').defaultTo(false);
    t.text('distribution_enabled_at');
    t.text('distribution_disabled_at');
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── event_feed_kills ───────────────────────────────────────────────────────
  await knex.schema.createTable('event_feed_kills', (t) => {
    t.text('id').primary();
    t.text('target_type').notNullable(); // 'offer' | 'organization'
    t.text('target_id').notNullable();
    t.text('killed_by').notNullable();
    t.text('killed_at').defaultTo(knex.fn.now());
    t.text('reason');
    t.boolean('is_active').defaultTo(true);
    t.text('restored_by');
    t.text('restored_at');
  });

  // ── event_feed_segments ────────────────────────────────────────────────────
  await knex.schema.createTable('event_feed_segments', (t) => {
    t.text('id').primary();
    t.text('name').notNullable();
    t.text('slug').notNullable().unique();
    t.text('type').notNullable(); // theme | geography | organization | event_type | creator | custom
    t.text('rules'); // JSON
    t.boolean('is_curated').defaultTo(false);
    t.text('created_by').notNullable();
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── event_feed_segment_offers ──────────────────────────────────────────────
  await knex.schema.createTable('event_feed_segment_offers', (t) => {
    t.text('segment_id').notNullable().references('id').inTable('event_feed_segments');
    t.text('offer_id').notNullable().references('id').inTable('offers');
    t.text('added_at').defaultTo(knex.fn.now());
    t.primary(['segment_id', 'offer_id']);
  });

  // ── feed_cache ─────────────────────────────────────────────────────────────
  await knex.schema.createTable('feed_cache', (t) => {
    t.increments('id').primary();
    t.text('cache_key').unique().notNullable();
    t.text('data').notNullable(); // JSON
    t.text('built_at').defaultTo(knex.fn.now());
  });

  // ── feed_exclusions ────────────────────────────────────────────────────────
  await knex.schema.createTable('feed_exclusions', (t) => {
    t.text('id').primary();
    t.text('offer_id').notNullable();
    t.text('reason').notNullable(); // killed | sold_out | inactive | deleted
    t.text('excluded_at').defaultTo(knex.fn.now());
  });

  // ── api_keys ───────────────────────────────────────────────────────────────
  await knex.schema.createTable('api_keys', (t) => {
    t.text('id').primary();
    t.text('key_hash').unique().notNullable();
    t.text('partner_name').notNullable();
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('revoked_at');
    t.integer('rate_limit').defaultTo(100);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('feed_exclusions');
  await knex.schema.dropTableIfExists('feed_cache');
  await knex.schema.dropTableIfExists('event_feed_segment_offers');
  await knex.schema.dropTableIfExists('event_feed_segments');
  await knex.schema.dropTableIfExists('event_feed_kills');
  await knex.schema.dropTableIfExists('offers');
}
