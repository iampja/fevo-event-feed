// ── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  fevo_org_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Venue ────────────────────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

// ── Event ────────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  fevo_event_id: string | null;
  organization_id: string | null;
  venue_id: string | null;
  date_utc: string | null;
  date_timezone: string | null;
  created_at: string;
  updated_at: string;
}

// ── Offer ────────────────────────────────────────────────────────────────────

export type OfferAvailability = 'available' | 'limited' | 'sold_out';
export type OfferStatus = 'active' | 'inactive' | 'sold_out' | 'deleted';
export type OfferSource = 'manual' | 'fevo_sync' | 'fevo_webhook';

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  availability: OfferAvailability;
  organization_id: string | null;
  organization_name: string | null;
  checkout_url: string | null;
  tags: string | null; // JSON array as string
  status: OfferStatus;
  distribution_enabled: boolean;
  distribution_enabled_at: string | null;
  distribution_disabled_at: string | null;
  created_at: string;
  updated_at: string;
  // New FEVO integration fields
  fevo_offer_id: string | null;
  fevo_url_code: string | null;
  event_id: string | null;
  venue_id: string | null;
  video_url: string | null;
  tickets_available: number | null;
  is_sold_out: boolean;
  source: OfferSource;
  fevo_synced_at: string | null;
}

// ── Sync Log ─────────────────────────────────────────────────────────────────

export type SyncStatus = 'running' | 'completed' | 'failed';

export interface SyncLog {
  id: string;
  sync_type: string;
  organization_id: string | null;
  started_at: string;
  completed_at: string | null;
  offers_created: number;
  offers_updated: number;
  errors: string | null; // JSON array of error strings
  status: SyncStatus;
}

// ── Reward Program ──────────────────────────────────────────────────────────

export type RewardType = 'money' | 'points' | 'discount' | 'merchandise' | 'custom';

export interface RewardProgram {
  id: string;
  offer_id: string;
  type: RewardType;
  headline: string;
  rule_amount: number;
  rule_unit: string;
  rule_per: string;
  created_at: string;
  updated_at: string;
}

// ── Reward Milestone ────────────────────────────────────────────────────────

export interface RewardMilestone {
  id: string;
  program_id: string;
  tier: number;
  threshold: number;
  label: string;
  reward: string;
  description: string | null;
  image_url: string | null;
}

// ── Reward (nested shape for feed response) ─────────────────────────────────

export interface FeedReward {
  program_id: string;
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

// ── Feed Offer (nested FEVO-shaped response) ─────────────────────────────────

export interface FeedOffer {
  offer_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price: { min: number | null; max: number | null; currency: string };
  date: { utc: string | null; timezone: string | null; display: string | null };
  venue: { name: string | null; city: string | null; state: string | null };
  organization: { id: string | null; name: string | null; logo_url: string | null };
  availability: OfferAvailability;
  checkout_url: string | null;
  tags: string[];
  media: { image_url: string | null; video_url: string | null };
  reward?: FeedReward;
  source: OfferSource;
  created_at: string;
  updated_at: string;
}

// ── Kill ─────────────────────────────────────────────────────────────────────

export type KillTargetType = 'offer' | 'organization';

export interface Kill {
  id: string;
  target_type: KillTargetType;
  target_id: string;
  killed_by: string;
  killed_at: string;
  reason: string | null;
  is_active: boolean;
  restored_by: string | null;
  restored_at: string | null;
}

// ── Segment ──────────────────────────────────────────────────────────────────

export type SegmentType =
  | 'theme'
  | 'geography'
  | 'organization'
  | 'event_type'
  | 'creator'
  | 'partner'
  | 'custom';

export interface Segment {
  id: string;
  name: string;
  slug: string;
  type: SegmentType;
  rules: string | null; // JSON
  is_curated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Segment <-> Offer join ───────────────────────────────────────────────────

export interface SegmentOffer {
  segment_id: string;
  offer_id: string;
  added_at: string;
}

// ── Feed exclusion ───────────────────────────────────────────────────────────

export type ExclusionReason = 'killed' | 'sold_out' | 'inactive' | 'deleted';

export interface FeedExclusion {
  id: string;
  offer_id: string;
  reason: ExclusionReason;
  excluded_at: string;
}

// ── API Key ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  key_hash: string;
  partner_name: string;
  created_at: string;
  revoked_at: string | null;
  rate_limit: number;
}

// ── Feed response ────────────────────────────────────────────────────────────

export interface FeedMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  built_at: string | null;
}

export interface FeedResponse {
  data: FeedOffer[];
  meta: FeedMeta;
}

// ── Query params ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface FilterParams {
  segment?: string;
  theme?: string;
  geography?: string;
  organization?: string;
  event_type?: string;
  creator?: string;
}
