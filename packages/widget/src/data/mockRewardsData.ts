import type {
  UserLifetimeStats,
  UserProgramProgress,
  ActivityFeedItem,
  EarningHistoryEntry,
  MonthlyEarning,
  RedemptionEntry,
  Achievement,
  LeaderboardEntry,
} from '../types';

export const MOCK_USER = {
  name: 'Alex Rivera',
  email: 'alex.rivera@email.com',
  member_since: '2025-03-15',
};

export const MOCK_STATS: UserLifetimeStats = {
  cash_earned: 85,
  merch_items: 3,
  experiences: 1,
  active_programs: 4,
  total_referrals: 47,
  total_tickets_sold: 156,
};

export const MOCK_PROGRAMS: UserProgramProgress[] = [
  {
    program_id: 'prog-mlb-nyy',
    program_name: 'Yankees vs Red Sox - Opening Day',
    reward_type: 'money',
    referrals: 7,
    tickets_sold: 7,
    rewards_earned: 35,
    current_tier: 1,
    milestones: [
      { tier: 1, threshold: 5, label: 'Starter', reward: '$25 cash back', reward_type: 'cash' },
      { tier: 2, threshold: 15, label: 'Pro', reward: 'Yankees fitted cap', reward_type: 'merchandise' },
      { tier: 3, threshold: 30, label: 'Legend', reward: 'Batting practice access', reward_type: 'experience' },
    ],
    recent_referrals: [
      { name: 'Jordan M.', tickets: 4, date: '2026-02-18' },
      { name: 'Casey L.', tickets: 2, date: '2026-02-16' },
      { name: 'Taylor K.', tickets: 1, date: '2026-02-14' },
    ],
  },
  {
    program_id: 'prog-concert-hk',
    program_name: 'Hello Kitty Nights',
    reward_type: 'money',
    referrals: 18,
    tickets_sold: 54,
    rewards_earned: 27,
    current_tier: 2,
    milestones: [
      { tier: 1, threshold: 3, label: 'Fan', reward: '$10 food credit', reward_type: 'cash' },
      { tier: 2, threshold: 10, label: 'Superfan', reward: 'Hello Kitty tee', reward_type: 'merchandise' },
      { tier: 3, threshold: 25, label: 'Ambassador', reward: 'Backstage meet & greet', reward_type: 'experience' },
    ],
    recent_referrals: [
      { name: 'Morgan S.', tickets: 3, date: '2026-02-17' },
      { name: 'Riley P.', tickets: 2, date: '2026-02-15' },
    ],
  },
  {
    program_id: 'prog-fest-summer',
    program_name: 'Summer Music Festival',
    reward_type: 'money',
    referrals: 7,
    tickets_sold: 24,
    rewards_earned: 15,
    current_tier: 1,
    milestones: [
      { tier: 1, threshold: 5, label: 'Opener', reward: '$15 cash back', reward_type: 'cash' },
      { tier: 2, threshold: 15, label: 'Headliner', reward: 'Festival tee & poster', reward_type: 'merchandise' },
      { tier: 3, threshold: 30, label: 'Legend', reward: 'Backstage pass', reward_type: 'experience' },
    ],
    recent_referrals: [
      { name: 'Jamie W.', tickets: 2, date: '2026-02-12' },
    ],
  },
  {
    program_id: 'prog-nba-bkn',
    program_name: 'Brooklyn Nets Home Games',
    reward_type: 'money',
    referrals: 15,
    tickets_sold: 71,
    rewards_earned: 12,
    current_tier: 2,
    milestones: [
      { tier: 1, threshold: 5, label: 'Rookie', reward: '$20 cash back', reward_type: 'cash' },
      { tier: 2, threshold: 12, label: 'Starter', reward: 'Nets snapback hat', reward_type: 'merchandise' },
      { tier: 3, threshold: 25, label: 'All-Star', reward: 'Courtside upgrade', reward_type: 'experience' },
    ],
    recent_referrals: [
      { name: 'Dana T.', tickets: 3, date: '2026-02-19' },
      { name: 'Sam K.', tickets: 2, date: '2026-02-17' },
    ],
  },
];

export const MOCK_ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: 'af1', text: 'You unlocked $25 cash back from Yankees Opening Day', time_ago: '2h ago' },
  { id: 'af2', text: 'Jamie S. hit 5 referrals — $15 cash back from Summer Fest', time_ago: '3h ago' },
  { id: 'af3', text: 'Morgan S. unlocked Hello Kitty tee from Hello Kitty Nights', time_ago: '5h ago' },
  { id: 'af4', text: 'You earned a Nets snapback hat from Brooklyn Nets', time_ago: '6h ago' },
  { id: 'af5', text: 'Pat D. unlocked $10 food credit from Hello Kitty Nights', time_ago: '1d ago' },
];

export const MOCK_EARNINGS: EarningHistoryEntry[] = [
  { id: 'e1', date: '2026-02-18', event: 'NY Yankees vs Red Sox', referral_name: 'Jordan M.', tickets: 4, reward: '$25 cash back', reward_type: 'cash', status: 'pending' },
  { id: 'e2', date: '2026-02-17', event: 'Hello Kitty Nights', referral_name: 'Morgan S.', tickets: 3, reward: 'Hello Kitty tee', reward_type: 'merchandise', status: 'pending' },
  { id: 'e3', date: '2026-02-16', event: 'NY Yankees vs Blue Jays', referral_name: 'Casey L.', tickets: 2, reward: '$25 cash back', reward_type: 'cash', status: 'confirmed' },
  { id: 'e4', date: '2026-02-15', event: 'Hello Kitty Nights', referral_name: 'Riley P.', tickets: 2, reward: '$10 food credit', reward_type: 'cash', status: 'deposited' },
  { id: 'e5', date: '2026-02-14', event: 'Brooklyn Nets vs Celtics', referral_name: 'Taylor K.', tickets: 6, reward: 'Nets snapback hat', reward_type: 'merchandise', status: 'shipped' },
  { id: 'e6', date: '2026-02-12', event: 'Summer Music Festival', referral_name: 'Jamie W.', tickets: 2, reward: '$15 cash back', reward_type: 'cash', status: 'deposited' },
  { id: 'e7', date: '2026-02-10', event: 'NY Yankees vs Orioles', referral_name: 'Pat D.', tickets: 3, reward: '$25 cash back', reward_type: 'cash', status: 'deposited' },
  { id: 'e8', date: '2026-02-08', event: 'Hello Kitty Nights', referral_name: 'Sam R.', tickets: 4, reward: 'Backstage meet & greet', reward_type: 'experience', status: 'booked' },
  { id: 'e9', date: '2026-02-05', event: 'Brooklyn Nets vs Lakers', referral_name: 'Chris B.', tickets: 2, reward: '$20 cash back', reward_type: 'cash', status: 'deposited' },
  { id: 'e10', date: '2026-02-01', event: 'Summer Music Festival', referral_name: 'Drew F.', tickets: 5, reward: 'Festival tee & poster', reward_type: 'merchandise', status: 'shipped' },
];

export const MOCK_MONTHLY_REWARDS: MonthlyEarning[] = [
  { month: 'Sep', amount: 5 },
  { month: 'Oct', amount: 8 },
  { month: 'Nov', amount: 3 },
  { month: 'Dec', amount: 15 },
  { month: 'Jan', amount: 27 },
  { month: 'Feb', amount: 31 },
];

export const MOCK_REDEMPTIONS: RedemptionEntry[] = [
  { id: 'r1', date: '2026-02-18', reward: '$25 cash back — Yankees Opening Day', type: 'cash', status: 'deposited', reference: 'RDM-2026-0218' },
  { id: 'r2', date: '2026-02-15', reward: 'Hello Kitty tee (L)', type: 'merchandise', status: 'shipped', reference: 'RDM-2026-0215' },
  { id: 'r3', date: '2026-02-08', reward: 'Backstage meet & greet — Hello Kitty Nights', type: 'experience', status: 'booked', reference: 'RDM-2026-0208' },
  { id: 'r4', date: '2026-01-31', reward: '$20 cash back — Brooklyn Nets', type: 'cash', status: 'deposited', reference: 'RDM-2026-0131' },
  { id: 'r5', date: '2026-01-20', reward: 'Nets snapback hat', type: 'merchandise', status: 'shipped', reference: 'RDM-2026-0120' },
  { id: 'r6', date: '2025-12-31', reward: '$15 cash back — Summer Music Festival', type: 'cash', status: 'deposited', reference: 'RDM-2025-1231' },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Share', description: 'Share your first referral link', icon: '🔗', unlocked: true, unlocked_date: '2025-10-18' },
  { id: 'a2', title: '5 Referrals', description: 'Refer 5 friends to events', icon: '👥', unlocked: true, unlocked_date: '2026-01-08' },
  { id: 'a3', title: 'Cash Tier 💵', description: 'Unlock a cash reward in any program', icon: '💵', unlocked: true, unlocked_date: '2026-01-15' },
  { id: 'a4', title: 'Social Butterfly', description: 'Share on 3 different platforms', icon: '🦋', unlocked: true, unlocked_date: '2026-01-20' },
  { id: 'a5', title: 'Multi-Event', description: 'Earn rewards from 3+ events', icon: '🎯', unlocked: true, unlocked_date: '2026-01-28' },
  { id: 'a6', title: 'Merch Tier 👕', description: 'Unlock a merchandise reward in any program', icon: '👕', unlocked: true, unlocked_date: '2026-02-05' },
  { id: 'a7', title: '25 Referrals', description: 'Refer 25 friends to events', icon: '🏆', unlocked: false },
  { id: 'a8', title: 'Experience Tier ⭐', description: 'Unlock an experience reward in any program', icon: '⭐', unlocked: false },
  { id: 'a9', title: 'Top 10', description: 'Reach top 10 on the leaderboard', icon: '🏅', unlocked: false },
  { id: 'a10', title: 'Triple Crown', description: 'Earn all 3 reward types: cash, merch, and experience', icon: '👑', unlocked: false },
  { id: 'a11', title: 'VIP Status', description: 'Attend 3 events via referral perks', icon: '💎', unlocked: false },
  { id: 'a12', title: 'Ambassador', description: 'Reach Ambassador tier in any program', icon: '🎖️', unlocked: false },
];

export const LEADERBOARD_MONTH: LeaderboardEntry[] = [
  { rank: 1, name: 'Samantha G.', referrals: 34, rewards: 52, is_current_user: false },
  { rank: 2, name: 'Mike T.', referrals: 29, rewards: 44, is_current_user: false },
  { rank: 3, name: 'Alex Rivera', referrals: 22, rewards: 31, is_current_user: true },
  { rank: 4, name: 'Priya K.', referrals: 19, rewards: 28, is_current_user: false },
  { rank: 5, name: 'David L.', referrals: 16, rewards: 22, is_current_user: false },
  { rank: 6, name: 'Emma W.', referrals: 14, rewards: 19, is_current_user: false },
  { rank: 7, name: 'Jason C.', referrals: 11, rewards: 15, is_current_user: false },
  { rank: 8, name: 'Olivia R.', referrals: 9, rewards: 12, is_current_user: false },
  { rank: 9, name: 'Brian H.', referrals: 7, rewards: 9, is_current_user: false },
  { rank: 10, name: 'Nina P.', referrals: 5, rewards: 6, is_current_user: false },
];

export const LEADERBOARD_ALL_TIME: LeaderboardEntry[] = [
  { rank: 1, name: 'Mike T.', referrals: 312, rewards: 845, is_current_user: false },
  { rank: 2, name: 'Samantha G.', referrals: 278, rewards: 712, is_current_user: false },
  { rank: 3, name: 'David L.', referrals: 195, rewards: 487, is_current_user: false },
  { rank: 4, name: 'Priya K.', referrals: 167, rewards: 398, is_current_user: false },
  { rank: 5, name: 'Emma W.', referrals: 143, rewards: 325, is_current_user: false },
  { rank: 6, name: 'Jason C.', referrals: 112, rewards: 264, is_current_user: false },
  { rank: 7, name: 'Brian H.', referrals: 89, rewards: 189, is_current_user: false },
  { rank: 8, name: 'Alex Rivera', referrals: 47, rewards: 89, is_current_user: true },
  { rank: 9, name: 'Olivia R.', referrals: 42, rewards: 105, is_current_user: false },
  { rank: 10, name: 'Nina P.', referrals: 38, rewards: 92, is_current_user: false },
];
