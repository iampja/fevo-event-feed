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
  // Use raw ALTER TABLE ADD COLUMN for SQLite — Knex's alterTable recreates
  // the table internally which fails when other tables have FK references to it.
  await knex.raw(`ALTER TABLE offers ADD COLUMN fevo_offer_id TEXT`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN fevo_url_code TEXT`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN event_id TEXT REFERENCES events(id)`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN venue_id TEXT REFERENCES venues(id)`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN video_url TEXT`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN tickets_available INTEGER`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN is_sold_out INTEGER DEFAULT 0`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN source TEXT DEFAULT 'manual'`);
  await knex.raw(`ALTER TABLE offers ADD COLUMN fevo_synced_at TEXT`);

  // ── indexes for new tables ─────────────────────────────────────────────────
  await knex.raw(`CREATE INDEX idx_organizations_fevo_org_id ON organizations(fevo_org_id)`);
  await knex.raw(`CREATE INDEX idx_events_fevo_event_id ON events(fevo_event_id)`);
  await knex.raw(`CREATE INDEX idx_events_org_id ON events(organization_id)`);
  await knex.raw(`CREATE INDEX idx_events_venue_id ON events(venue_id)`);
  await knex.raw(`CREATE INDEX idx_offers_fevo_offer_id ON offers(fevo_offer_id)`);
  await knex.raw(`CREATE INDEX idx_offers_event_id ON offers(event_id)`);
  await knex.raw(`CREATE INDEX idx_offers_venue_id ON offers(venue_id)`);
  await knex.raw(`CREATE INDEX idx_offers_source ON offers(source)`);
  await knex.raw(`CREATE INDEX idx_sync_log_org_id ON sync_log(organization_id)`);
  await knex.raw(`CREATE INDEX idx_sync_log_status ON sync_log(status)`);
}

export async function down(knex: Knex): Promise<void> {
  // Drop indexes
  await knex.raw(`DROP INDEX IF EXISTS idx_offers_fevo_offer_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_offers_event_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_offers_venue_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_offers_source`);
  await knex.raw(`DROP INDEX IF EXISTS idx_organizations_fevo_org_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_events_fevo_event_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_events_org_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_events_venue_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_sync_log_org_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_sync_log_status`);

  // Remove new columns from offers — SQLite requires table recreation
  // Disable FK checks to avoid constraint errors during recreation
  await knex.raw(`PRAGMA foreign_keys = OFF`);
  await knex.raw(`
    CREATE TABLE offers_backup AS SELECT
      id, title, description, image_url, price_min, price_max, currency,
      date, venue_name, venue_city, venue_state, availability,
      organization_id, organization_name, checkout_url, tags, status,
      distribution_enabled, distribution_enabled_at, distribution_disabled_at,
      created_at, updated_at
    FROM offers
  `);
  await knex.raw(`DROP TABLE offers`);
  await knex.raw(`ALTER TABLE offers_backup RENAME TO offers`);
  await knex.raw(`PRAGMA foreign_keys = ON`);

  // Drop new tables in reverse dependency order
  await knex.schema.dropTableIfExists('sync_log');
  await knex.schema.dropTableIfExists('events');
  await knex.schema.dropTableIfExists('venues');
  await knex.schema.dropTableIfExists('organizations');
}
