import type {
  UserLifetimeStats,
  UserProgramProgress,
  EarningHistoryEntry,
  MonthlyEarning,
  PayoutEntry,
  Achievement,
  LeaderboardEntry,
} from '../types';

export const MOCK_USER = {
  name: 'Alex Rivera',
  email: 'alex.rivera@email.com',
  member_since: '2025-03-15',
};

export const MOCK_STATS: UserLifetimeStats = {
  total_earned: 1247.5,
  pending: 185.0,
  paid_out: 1062.5,
  active_programs: 3,
  total_referrals: 47,
  total_tickets_sold: 156,
};

export const MOCK_PROGRAMS: UserProgramProgress[] = [
  {
    program_id: 'prog-mlb-nyy',
    program_name: 'NY Yankees 2026 Season',
    reward_type: 'money',
    referrals: 22,
    tickets_sold: 78,
    earned: 780.0,
    current_tier: 2,
    milestones: [
      { tier: 1, threshold: 5, label: 'Starter', reward: '$5 per referral' },
      { tier: 2, threshold: 15, label: 'All-Star', reward: '$10 per referral' },
      { tier: 3, threshold: 30, label: 'MVP', reward: '$15 per referral + VIP Pass' },
    ],
    recent_referrals: [
      { name: 'Jordan M.', tickets: 4, date: '2026-02-18' },
      { name: 'Casey L.', tickets: 2, date: '2026-02-16' },
      { name: 'Taylor K.', tickets: 6, date: '2026-02-14' },
    ],
  },
  {
    program_id: 'prog-concert-hk',
    program_name: 'Hello Kitty Nights',
    reward_type: 'money',
    referrals: 18,
    tickets_sold: 54,
    earned: 367.5,
    current_tier: 2,
    milestones: [
      { tier: 1, threshold: 3, label: 'Fan', reward: '$5 per ticket sold' },
      { tier: 2, threshold: 10, label: 'Superfan', reward: '$7.50 per ticket' },
      { tier: 3, threshold: 25, label: 'Ambassador', reward: '$10 per ticket + Merch' },
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
    earned: 100.0,
    current_tier: 1,
    milestones: [
      { tier: 1, threshold: 5, label: 'Opener', reward: '$5 per referral' },
      { tier: 2, threshold: 15, label: 'Headliner', reward: '$10 per referral' },
      { tier: 3, threshold: 30, label: 'Legend', reward: '$20 per referral + Backstage' },
    ],
    recent_referrals: [
      { name: 'Jamie W.', tickets: 2, date: '2026-02-12' },
    ],
  },
];

export const MOCK_EARNINGS: EarningHistoryEntry[] = [
  { id: 'e1', date: '2026-02-18', event: 'NY Yankees vs Red Sox', referral_name: 'Jordan M.', tickets: 4, amount: 40.0, status: 'pending' },
  { id: 'e2', date: '2026-02-17', event: 'Hello Kitty Nights', referral_name: 'Morgan S.', tickets: 3, amount: 22.5, status: 'pending' },
  { id: 'e3', date: '2026-02-16', event: 'NY Yankees vs Blue Jays', referral_name: 'Casey L.', tickets: 2, amount: 20.0, status: 'confirmed' },
  { id: 'e4', date: '2026-02-15', event: 'Hello Kitty Nights', referral_name: 'Riley P.', tickets: 2, amount: 15.0, status: 'confirmed' },
  { id: 'e5', date: '2026-02-14', event: 'NY Yankees vs Mets', referral_name: 'Taylor K.', tickets: 6, amount: 60.0, status: 'confirmed' },
  { id: 'e6', date: '2026-02-12', event: 'Summer Music Festival', referral_name: 'Jamie W.', tickets: 2, amount: 10.0, status: 'confirmed' },
  { id: 'e7', date: '2026-02-10', event: 'NY Yankees vs Orioles', referral_name: 'Pat D.', tickets: 3, amount: 30.0, status: 'paid' },
  { id: 'e8', date: '2026-02-08', event: 'Hello Kitty Nights', referral_name: 'Sam R.', tickets: 4, amount: 30.0, status: 'paid' },
  { id: 'e9', date: '2026-02-05', event: 'NY Yankees vs Rays', referral_name: 'Chris B.', tickets: 2, amount: 20.0, status: 'paid' },
  { id: 'e10', date: '2026-02-01', event: 'Summer Music Festival', referral_name: 'Drew F.', tickets: 5, amount: 25.0, status: 'paid' },
];

export const MOCK_MONTHLY_EARNINGS: MonthlyEarning[] = [
  { month: 'Sep', amount: 85 },
  { month: 'Oct', amount: 145 },
  { month: 'Nov', amount: 120 },
  { month: 'Dec', amount: 210 },
  { month: 'Jan', amount: 290 },
  { month: 'Feb', amount: 397.5 },
];

export const MOCK_PAYOUTS: PayoutEntry[] = [
  { id: 'p1', date: '2026-02-15', amount: 350.0, method: 'PayPal (alex@email.com)', status: 'completed', reference: 'PAY-2026-0215' },
  { id: 'p2', date: '2026-01-31', amount: 412.5, method: 'PayPal (alex@email.com)', status: 'completed', reference: 'PAY-2026-0131' },
  { id: 'p3', date: '2025-12-31', amount: 300.0, method: 'PayPal (alex@email.com)', status: 'completed', reference: 'PAY-2025-1231' },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Share', description: 'Share your first referral link', icon: '🔗', unlocked: true, unlocked_date: '2025-03-16' },
  { id: 'a2', title: 'First Sale', description: 'Your first referral bought tickets', icon: '🎟️', unlocked: true, unlocked_date: '2025-03-20' },
  { id: 'a3', title: '10 Referrals', description: 'Refer 10 friends to events', icon: '👥', unlocked: true, unlocked_date: '2025-06-14' },
  { id: 'a4', title: '$500 Club', description: 'Earn $500 in total rewards', icon: '💰', unlocked: true, unlocked_date: '2025-09-22' },
  { id: 'a5', title: 'Multi-Event', description: 'Earn from 3+ different events', icon: '🎯', unlocked: true, unlocked_date: '2025-10-10' },
  { id: 'a6', title: '50 Referrals', description: 'Refer 50 friends to events', icon: '🏆', unlocked: false },
  { id: 'a7', title: '$2,000 Club', description: 'Earn $2,000 in total rewards', icon: '💎', unlocked: false },
  { id: 'a8', title: 'Top 10', description: 'Reach top 10 on the leaderboard', icon: '⭐', unlocked: false },
];

export const LEADERBOARD_MONTH: LeaderboardEntry[] = [
  { rank: 1, name: 'Samantha G.', referrals: 34, earned: 520.0, is_current_user: false },
  { rank: 2, name: 'Mike T.', referrals: 29, earned: 445.0, is_current_user: false },
  { rank: 3, name: 'Alex Rivera', referrals: 22, earned: 397.5, is_current_user: true },
  { rank: 4, name: 'Priya K.', referrals: 19, earned: 310.0, is_current_user: false },
  { rank: 5, name: 'David L.', referrals: 16, earned: 265.0, is_current_user: false },
  { rank: 6, name: 'Emma W.', referrals: 14, earned: 220.0, is_current_user: false },
  { rank: 7, name: 'Jason C.', referrals: 11, earned: 175.0, is_current_user: false },
  { rank: 8, name: 'Olivia R.', referrals: 9, earned: 140.0, is_current_user: false },
  { rank: 9, name: 'Brian H.', referrals: 7, earned: 105.0, is_current_user: false },
  { rank: 10, name: 'Nina P.', referrals: 5, earned: 75.0, is_current_user: false },
];

export const LEADERBOARD_ALL_TIME: LeaderboardEntry[] = [
  { rank: 1, name: 'Mike T.', referrals: 312, earned: 8450.0, is_current_user: false },
  { rank: 2, name: 'Samantha G.', referrals: 278, earned: 7120.0, is_current_user: false },
  { rank: 3, name: 'David L.', referrals: 195, earned: 4870.0, is_current_user: false },
  { rank: 4, name: 'Priya K.', referrals: 167, earned: 3980.0, is_current_user: false },
  { rank: 5, name: 'Emma W.', referrals: 143, earned: 3250.0, is_current_user: false },
  { rank: 6, name: 'Jason C.', referrals: 112, earned: 2640.0, is_current_user: false },
  { rank: 7, name: 'Brian H.', referrals: 89, earned: 1890.0, is_current_user: false },
  { rank: 8, name: 'Alex Rivera', referrals: 47, earned: 1247.5, is_current_user: true },
  { rank: 9, name: 'Olivia R.', referrals: 42, earned: 1050.0, is_current_user: false },
  { rank: 10, name: 'Nina P.', referrals: 38, earned: 920.0, is_current_user: false },
];
