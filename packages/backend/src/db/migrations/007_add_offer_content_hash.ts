import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('offers', (table) => {
    table.string('content_hash', 64).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('offers', (table) => {
    table.dropColumn('content_hash');
  });
}
