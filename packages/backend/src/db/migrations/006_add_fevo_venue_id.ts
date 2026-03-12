import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE venues ADD COLUMN fevo_venue_id TEXT`);
  await knex.raw(`CREATE INDEX idx_venues_fevo_venue_id ON venues(fevo_venue_id)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS idx_venues_fevo_venue_id`);
  // SQLite doesn't support DROP COLUMN directly in older versions;
  // fevo_venue_id is nullable so leaving it is harmless on rollback.
}
