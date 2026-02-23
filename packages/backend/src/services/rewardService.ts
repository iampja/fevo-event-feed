import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { RewardProgram, RewardMilestone, FeedReward, RewardType } from '../models/types';

// ── Read ────────────────────────────────────────────────────────────────────

/**
 * Get the reward program for an offer (if one exists).
 */
export async function getRewardByOfferId(offerId: string): Promise<FeedReward | null> {
  const program = await db('reward_programs').where('offer_id', offerId).first();
  if (!program) return null;

  const milestones = await db('reward_milestones')
    .where('program_id', program.id)
    .orderBy('tier', 'asc');

  return toFeedReward(program, milestones);
}

/**
 * Batch-fetch rewards for a list of offer IDs.
 * Returns a map of offerId -> FeedReward.
 */
export async function getRewardsByOfferIds(
  offerIds: string[]
): Promise<Record<string, FeedReward>> {
  if (offerIds.length === 0) return {};

  const programs: RewardProgram[] = await db('reward_programs').whereIn('offer_id', offerIds);
  if (programs.length === 0) return {};

  const programIds = programs.map((p) => p.id);
  const milestones: RewardMilestone[] = await db('reward_milestones')
    .whereIn('program_id', programIds)
    .orderBy('tier', 'asc');

  // Group milestones by program_id
  const milestonesByProgram: Record<string, RewardMilestone[]> = {};
  for (const m of milestones) {
    if (!milestonesByProgram[m.program_id]) milestonesByProgram[m.program_id] = [];
    milestonesByProgram[m.program_id].push(m);
  }

  const result: Record<string, FeedReward> = {};
  for (const program of programs) {
    result[program.offer_id] = toFeedReward(
      program,
      milestonesByProgram[program.id] || []
    );
  }

  return result;
}

// ── Create ──────────────────────────────────────────────────────────────────

export interface CreateRewardInput {
  offer_id: string;
  type: RewardType;
  headline: string;
  rule: { amount: number; unit: string; per: string };
  milestones: {
    tier: number;
    threshold: number;
    label: string;
    reward: string;
    description?: string;
    image_url?: string;
  }[];
}

/**
 * Create a reward program with milestones for an offer.
 */
export async function createReward(data: CreateRewardInput): Promise<FeedReward> {
  const existing = await db('reward_programs').where('offer_id', data.offer_id).first();
  if (existing) {
    throw new Error(`Reward program already exists for offer ${data.offer_id}`);
  }

  const offer = await db('offers').where('id', data.offer_id).first();
  if (!offer) {
    throw new Error(`Offer not found: ${data.offer_id}`);
  }

  const now = new Date().toISOString();
  const programId = uuidv4();

  const program: RewardProgram = {
    id: programId,
    offer_id: data.offer_id,
    type: data.type,
    headline: data.headline,
    rule_amount: data.rule.amount,
    rule_unit: data.rule.unit,
    rule_per: data.rule.per,
    created_at: now,
    updated_at: now,
  };

  const milestones: RewardMilestone[] = data.milestones.map((m) => ({
    id: uuidv4(),
    program_id: programId,
    tier: m.tier,
    threshold: m.threshold,
    label: m.label,
    reward: m.reward,
    description: m.description ?? null,
    image_url: m.image_url ?? null,
  }));

  await db.transaction(async (trx) => {
    await trx('reward_programs').insert(program);
    if (milestones.length > 0) {
      await trx('reward_milestones').insert(milestones);
    }
  });

  return toFeedReward(program, milestones);
}

// ── Update ──────────────────────────────────────────────────────────────────

export interface UpdateRewardInput {
  type?: RewardType;
  headline?: string;
  rule?: { amount: number; unit: string; per: string };
  milestones?: {
    tier: number;
    threshold: number;
    label: string;
    reward: string;
    description?: string;
    image_url?: string;
  }[];
}

/**
 * Update a reward program (and optionally replace milestones).
 */
export async function updateReward(
  offerId: string,
  data: UpdateRewardInput
): Promise<FeedReward> {
  const program = await db('reward_programs').where('offer_id', offerId).first();
  if (!program) {
    throw new Error(`Reward program not found for offer ${offerId}`);
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.type !== undefined) updates.type = data.type;
  if (data.headline !== undefined) updates.headline = data.headline;
  if (data.rule) {
    updates.rule_amount = data.rule.amount;
    updates.rule_unit = data.rule.unit;
    updates.rule_per = data.rule.per;
  }

  await db.transaction(async (trx) => {
    await trx('reward_programs').where('id', program.id).update(updates);

    if (data.milestones) {
      await trx('reward_milestones').where('program_id', program.id).del();
      const milestones: RewardMilestone[] = data.milestones.map((m) => ({
        id: uuidv4(),
        program_id: program.id,
        tier: m.tier,
        threshold: m.threshold,
        label: m.label,
        reward: m.reward,
        description: m.description ?? null,
        image_url: m.image_url ?? null,
      }));
      if (milestones.length > 0) {
        await trx('reward_milestones').insert(milestones);
      }
    }
  });

  return (await getRewardByOfferId(offerId))!;
}

// ── Delete ──────────────────────────────────────────────────────────────────

/**
 * Delete a reward program and its milestones.
 */
export async function deleteReward(offerId: string): Promise<void> {
  const program = await db('reward_programs').where('offer_id', offerId).first();
  if (!program) {
    throw new Error(`Reward program not found for offer ${offerId}`);
  }

  await db.transaction(async (trx) => {
    await trx('reward_milestones').where('program_id', program.id).del();
    await trx('reward_programs').where('id', program.id).del();
  });
}

// ── List ────────────────────────────────────────────────────────────────────

/**
 * List all reward programs.
 */
export async function listRewards(): Promise<FeedReward[]> {
  const programs: RewardProgram[] = await db('reward_programs').orderBy('created_at', 'desc');
  if (programs.length === 0) return [];

  const programIds = programs.map((p) => p.id);
  const milestones: RewardMilestone[] = await db('reward_milestones')
    .whereIn('program_id', programIds)
    .orderBy('tier', 'asc');

  const milestonesByProgram: Record<string, RewardMilestone[]> = {};
  for (const m of milestones) {
    if (!milestonesByProgram[m.program_id]) milestonesByProgram[m.program_id] = [];
    milestonesByProgram[m.program_id].push(m);
  }

  return programs.map((p) => toFeedReward(p, milestonesByProgram[p.id] || []));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toFeedReward(program: RewardProgram, milestones: RewardMilestone[]): FeedReward {
  return {
    program_id: program.id,
    type: program.type as RewardType,
    headline: program.headline,
    rule: {
      amount: program.rule_amount,
      unit: program.rule_unit,
      per: program.rule_per,
    },
    milestones: milestones.map((m) => ({
      tier: m.tier,
      threshold: m.threshold,
      label: m.label,
      reward: m.reward,
      ...(m.description ? { description: m.description } : {}),
      ...(m.image_url ? { image_url: m.image_url } : {}),
    })),
  };
}
