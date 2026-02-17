// ── Offer ────────────────────────────────────────────────────────────────────

export type OfferAvailability = 'available' | 'limited' | 'sold_out';
export type OfferStatus = 'active' | 'inactive' | 'sold_out' | 'deleted';

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
  data: Offer[];
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
