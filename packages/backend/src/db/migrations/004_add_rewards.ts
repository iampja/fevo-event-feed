import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── reward_programs ───────────────────────────────────────────────────────
  await knex.schema.createTable('reward_programs', (t) => {
    t.text('id').primary();
    t.text('offer_id').notNullable().references('id').inTable('offers');
    t.text('type').notNullable(); // 'money' | 'points' | 'discount' | 'merchandise' | 'custom'
    t.text('headline').notNullable();
    t.float('rule_amount').notNullable();
    t.text('rule_unit').notNullable();
    t.text('rule_per').notNullable();
    t.text('created_at').defaultTo(knex.fn.now());
    t.text('updated_at').defaultTo(knex.fn.now());
  });

  // ── reward_milestones ─────────────────────────────────────────────────────
  await knex.schema.createTable('reward_milestones', (t) => {
    t.text('id').primary();
    t.text('program_id').notNullable().references('id').inTable('reward_programs');
    t.integer('tier').notNullable();
    t.integer('threshold').notNullable();
    t.text('label').notNullable();
    t.text('reward').notNullable();
    t.text('description');
    t.text('image_url');
  });

  // ── indexes ───────────────────────────────────────────────────────────────
  await knex.raw(`CREATE INDEX idx_reward_programs_offer_id ON reward_programs(offer_id)`);
  await knex.raw(`CREATE INDEX idx_reward_milestones_program_id ON reward_milestones(program_id)`);
  await knex.raw(`CREATE UNIQUE INDEX idx_reward_milestones_program_tier ON reward_milestones(program_id, tier)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS idx_reward_milestones_program_tier`);
  await knex.raw(`DROP INDEX IF EXISTS idx_reward_milestones_program_id`);
  await knex.raw(`DROP INDEX IF EXISTS idx_reward_programs_offer_id`);

  await knex.schema.dropTableIfExists('reward_milestones');
  await knex.schema.dropTableIfExists('reward_programs');
}
