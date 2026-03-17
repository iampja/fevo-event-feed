import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Clear content hashes to force a full re-sync.
  // This ensures the new category/subcategory columns get populated
  // and any venue data the API now returns gets stored.
  await knex('offers').update({ content_hash: null });
}

export async function down(_knex: Knex): Promise<void> {
  // No-op — re-sync is idempotent
}
