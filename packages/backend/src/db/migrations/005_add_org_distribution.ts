import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (t) => {
    t.boolean('distribution_enabled').defaultTo(false);
    t.text('distribution_enabled_at');
    t.text('distribution_disabled_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (t) => {
    t.dropColumn('distribution_enabled');
    t.dropColumn('distribution_enabled_at');
    t.dropColumn('distribution_disabled_at');
  });
}
