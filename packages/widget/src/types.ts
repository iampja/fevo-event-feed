export type DateValue = string | { utc: string | null; timezone: string | null; display: string | null };

export type RewardType = 'money' | 'points' | 'discount' | 'merchandise' | 'custom';

export type TierRewardType = 'cash' | 'merchandise' | 'experience';

export type RewardMilestone = {
  tier: number;
  threshold: number;
  label: string;
  reward: string;
  description?: string;
  image_url?: string;
  reward_type?: TierRewardType;
};

export type Reward = {
  program_id: string;
  type: RewardType;
  headline: string;
  rule: { amount: number; unit: string; per: string };
  milestones: RewardMilestone[];
};

export type Offer = {
  offer_id: string;
  title: string;
  description: string;
  image_url: string;
  price: { min: number; max: number; currency: string };
  date: DateValue;
  venue: { name: string; city: string; state: string };
  availability: 'available' | 'limited' | 'sold_out';
  organization: { id: string; name: string; logo_url?: string | null; category?: string | null; subcategory?: string | null };
  checkout_url: string;
  tags: string[];
  media?: { image_url: string | null; video_url: string | null };
  reward?: Reward;
  source?: string;
  created_at: string;
  updated_at: string;
};

export type FeedResponse = {
  data: Offer[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
  feed_updated_at: string;
};

export type WidgetConfig = {
  segment?: string;
  theme?: 'light' | 'dark' | 'marketplace';
  columns?: 1 | 2 | 3 | 4;
  maxCards?: number;
  apiUrl?: string;
  apiKey?: string;
  partnerId?: string;
  geo?: string;
  search?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showCreateCta?: boolean;
  signupUrl?: string;
  mode?: 'feed' | 'offer' | 'marketplace';
  offerId?: string;
};

export type WidgetState = 'loading' | 'ready' | 'empty' | 'error';

export type AnalyticsEvent = {
  type:
    | 'widget_loaded'
    | 'offer_card_viewed'
    | 'offer_card_clicked'
    | 'widget_error'
    | 'widget_refreshed'
    | 'offer_detail_opened';
  data: Record<string, unknown>;
};

/* ===== Rewards Dashboard Types ===== */

export type UserLifetimeStats = {
  cash_earned: number;
  merch_items: number;
  experiences: number;
  active_programs: number;
  total_referrals: number;
  total_tickets_sold: number;
};

export type UserProgramProgress = {
  program_id: string;
  program_name: string;
  reward_type: RewardType;
  referrals: number;
  tickets_sold: number;
  rewards_earned: number;
  current_tier: number;
  milestones: RewardMilestone[];
  recent_referrals: { name: string; tickets: number; date: string }[];
};

export type ActivityFeedItem = {
  id: string;
  text: string;
  time_ago: string;
};

export type EarningHistoryEntry = {
  id: string;
  date: string;
  event: string;
  referral_name: string;
  tickets: number;
  reward: string;
  reward_type: TierRewardType;
  status: 'pending' | 'confirmed' | 'deposited' | 'shipped' | 'booked';
};

export type MonthlyEarning = {
  month: string;
  amount: number;
};

export type RedemptionEntry = {
  id: string;
  date: string;
  reward: string;
  type: TierRewardType;
  status: 'processing' | 'deposited' | 'shipped' | 'booked' | 'failed';
  reference: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_date?: string;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  referrals: number;
  rewards: number;
  is_current_user: boolean;
};
