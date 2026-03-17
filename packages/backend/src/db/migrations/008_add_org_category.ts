import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add category/subcategory to organizations
  await knex.schema.alterTable('organizations', (t) => {
    t.text('category');
    t.text('subcategory');
  });

  // Denormalize category onto offers for fast filtering
  await knex.schema.alterTable('offers', (t) => {
    t.text('category');
    t.text('subcategory');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('organizations', (t) => {
    t.dropColumn('category');
    t.dropColumn('subcategory');
  });
  await knex.schema.alterTable('offers', (t) => {
    t.dropColumn('category');
    t.dropColumn('subcategory');
  });
}
