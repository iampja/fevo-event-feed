/** @jsxImportSource preact */

import { useState } from 'preact/hooks';
import type {
  UserLifetimeStats,
  UserProgramProgress,
  ActivityFeedItem,
  MonthlyEarning,
  Achievement,
  LeaderboardEntry,
  TierRewardType,
} from '../../types';

type OverviewTabProps = {
  stats: UserLifetimeStats;
  programs: UserProgramProgress[];
  activityFeed: ActivityFeedItem[];
  monthlyRewards: MonthlyEarning[];
  achievements: Achievement[];
  leaderboardMonth: LeaderboardEntry[];
  leaderboardAllTime: LeaderboardEntry[];
};

export function OverviewTab({
  stats,
  programs,
  activityFeed,
  monthlyRewards,
  achievements,
  leaderboardMonth,
  leaderboardAllTime,
}: OverviewTabProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);
  const [lbPeriod, setLbPeriod] = useState<'month' | 'alltime'>('month');

  const leaderboard = lbPeriod === 'month' ? leaderboardMonth : leaderboardAllTime;
  const maxMonthly = Math.max(...monthlyRewards.map((m) => m.amount), 1);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const TIER_ICONS: Record<TierRewardType, string> = { cash: '💵', merchandise: '👕', experience: '⭐' };

  // Feature the first program as "highlighted"
  const featuredProgram = programs[0];
  const featuredMilestone = featuredProgram?.milestones.find(
    (m) => m.tier === featuredProgram.current_tier,
  );

  return (
    <div class="fevo-ef-dash-overview">
      {/* How Rewards Work — gradient banner */}
      <div class="fevo-ef-dash-how-banner">
        <div class="fevo-ef-dash-how-banner-head">
          <div>
            <div class="fevo-ef-dash-how-banner-title">How Rewards Work</div>
            <div class="fevo-ef-dash-how-banner-sub">
              Earn rewards every time someone joins through your personal link.
            </div>
          </div>
        </div>
        {howItWorksOpen && (
          <div class="fevo-ef-dash-how-banner-body">
            <div class="fevo-ef-dash-how-steps">
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">1</div>
                <div class="fevo-ef-dash-how-step-title">Share Link</div>
                <div class="fevo-ef-dash-how-step-desc">Get your unique referral link</div>
              </div>
              <div class="fevo-ef-dash-how-connector" />
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">2</div>
                <div class="fevo-ef-dash-how-step-title">Friends Buy</div>
                <div class="fevo-ef-dash-how-step-desc">They purchase tickets via your link</div>
              </div>
              <div class="fevo-ef-dash-how-connector" />
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">3</div>
                <div class="fevo-ef-dash-how-step-title">You Earn</div>
                <div class="fevo-ef-dash-how-step-desc">Unlock rewards for every ticket sold</div>
              </div>
            </div>
          </div>
        )}
        <div class="fevo-ef-dash-how-banner-actions">
          <button class="fevo-ef-dash-how-get-started">Get Started</button>
          <button
            class="fevo-ef-dash-how-collapse"
            onClick={() => setHowItWorksOpen(!howItWorksOpen)}
          >
            {howItWorksOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Activity Ticker */}
      <div class="fevo-ef-dash-ticker">
        <div class="fevo-ef-dash-ticker-track">
          {/* Duplicate for seamless scroll */}
          {[...activityFeed, ...activityFeed].map((item, i) => (
            <span key={`${item.id}-${i}`} class="fevo-ef-dash-ticker-item">
              <span class="fevo-ef-dash-ticker-dot" />
              {item.text}
              <span class="fevo-ef-dash-ticker-time"> — {item.time_ago}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div class="fevo-ef-dash-stats">
        <div class="fevo-ef-dash-stat-card fevo-ef-dash-stat-cash">
          <div class="fevo-ef-dash-stat-icon">💵</div>
          <div class="fevo-ef-dash-stat-value">${stats.cash_earned}</div>
          <div class="fevo-ef-dash-stat-label">Cash Earned</div>
        </div>
        <div class="fevo-ef-dash-stat-card fevo-ef-dash-stat-merch">
          <div class="fevo-ef-dash-stat-icon">👕</div>
          <div class="fevo-ef-dash-stat-value">{stats.merch_items}</div>
          <div class="fevo-ef-dash-stat-label">Merch Items</div>
        </div>
        <div class="fevo-ef-dash-stat-card fevo-ef-dash-stat-exp">
          <div class="fevo-ef-dash-stat-icon">⭐</div>
          <div class="fevo-ef-dash-stat-value">{stats.experiences}</div>
          <div class="fevo-ef-dash-stat-label">Experiences</div>
        </div>
        <div class="fevo-ef-dash-stat-card">
          <div class="fevo-ef-dash-stat-icon"> </div>
          <div class="fevo-ef-dash-stat-value">{stats.active_programs}</div>
          <div class="fevo-ef-dash-stat-label">Active Programs</div>
        </div>
      </div>

      {/* Monthly Rewards Chart */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Monthly Rewards</h3>
        <div class="fevo-ef-dash-chart">
          {monthlyRewards.map((m) => (
            <div key={m.month} class="fevo-ef-dash-chart-col">
              <div class="fevo-ef-dash-chart-value">{m.amount}</div>
              <div class="fevo-ef-dash-chart-bar-wrap">
                <div
                  class="fevo-ef-dash-chart-bar"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%` }}
                />
              </div>
              <div class="fevo-ef-dash-chart-label">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Program */}
      {featuredProgram && (
        <div class="fevo-ef-dash-featured">
          <div class="fevo-ef-dash-featured-icon">★</div>
          <div class="fevo-ef-dash-featured-info">
            <div class="fevo-ef-dash-featured-name">{featuredProgram.program_name}</div>
            <div class="fevo-ef-dash-featured-meta">
              {featuredMilestone?.reward_type && TIER_ICONS[featuredMilestone.reward_type]}{' '}
              {featuredProgram.tickets_sold} tickets sold · {featuredMilestone?.label ?? 'Tier ' + featuredProgram.current_tier} tier · {featuredMilestone?.reward}
            </div>
          </div>
        </div>
      )}

      {/* Active Programs */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Active Programs</h3>
        {programs.map((prog) => {
          const nextMilestone = prog.milestones.find((m) => m.tier === prog.current_tier + 1);

          return (
            <div key={prog.program_id} class="fevo-ef-dash-program">
              <div class="fevo-ef-dash-program-header">
                <div class="fevo-ef-dash-program-name">{prog.program_name}</div>
                <span class="fevo-ef-dash-program-refs">{prog.referrals} referrals · {prog.tickets_sold} tickets</span>
              </div>
              <div class="fevo-ef-dash-tier-ladder">
                {prog.milestones.map((ms) => {
                  const reached = ms.tier <= prog.current_tier;
                  const isCurrent = ms.tier === prog.current_tier;
                  const icon = ms.reward_type ? TIER_ICONS[ms.reward_type] : '🎁';
                  return (
                    <div
                      key={ms.tier}
                      class={`fevo-ef-dash-tier-step${reached ? ' reached' : ''}${isCurrent ? ' current' : ''}`}
                      data-tier-level={ms.tier}
                    >
                      <span class="fevo-ef-dash-tier-step-icon">{icon}</span>
                      <div class="fevo-ef-dash-tier-step-info">
                        <div class="fevo-ef-dash-tier-step-label">{ms.label}</div>
                        <div class="fevo-ef-dash-tier-step-reward">{ms.reward}</div>
                        <div class="fevo-ef-dash-tier-step-threshold">{ms.threshold} referrals</div>
                      </div>
                      {reached && <span class="fevo-ef-dash-tier-step-check">✓</span>}
                    </div>
                  );
                })}
              </div>
              {nextMilestone && (
                <div class="fevo-ef-dash-program-progress-label">
                  {nextMilestone.threshold - prog.referrals} more referrals to unlock {nextMilestone.reward_type ? TIER_ICONS[nextMilestone.reward_type] : ''} {nextMilestone.reward}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements & Badges */}
      <div class="fevo-ef-dash-section">
        <div class="fevo-ef-dash-section-header">
          <h3 class="fevo-ef-dash-section-title">Achievements & Badges</h3>
          <span class="fevo-ef-dash-ach-count">{unlockedCount} of {achievements.length} unlocked</span>
        </div>
        <div class="fevo-ef-dash-achievements">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              class={`fevo-ef-dash-achievement ${ach.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div class="fevo-ef-dash-achievement-icon-wrap">
                <div class="fevo-ef-dash-achievement-icon">{ach.icon}</div>
                {!ach.unlocked && <div class="fevo-ef-dash-achievement-lock">🔒</div>}
              </div>
              <div class="fevo-ef-dash-achievement-title">{ach.title}</div>
              {ach.unlocked && ach.unlocked_date && (
                <div class="fevo-ef-dash-achievement-date">Earned {ach.unlocked_date}</div>
              )}
              {!ach.unlocked && (
                <div class="fevo-ef-dash-achievement-desc">{ach.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div class="fevo-ef-dash-section">
        <div class="fevo-ef-dash-section-header">
          <h3 class="fevo-ef-dash-section-title">Leaderboard</h3>
          <div class="fevo-ef-dash-lb-toggle">
            <button
              class={`fevo-ef-dash-lb-btn ${lbPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setLbPeriod('month')}
            >
              This Month
            </button>
            <button
              class={`fevo-ef-dash-lb-btn ${lbPeriod === 'alltime' ? 'active' : ''}`}
              onClick={() => setLbPeriod('alltime')}
            >
              All Time
            </button>
          </div>
        </div>
        <table class="fevo-ef-dash-lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Referrals</th>
              <th>Rewards</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr
                key={entry.rank}
                class={entry.is_current_user ? 'fevo-ef-dash-lb-me' : ''}
              >
                <td>{entry.rank}</td>
                <td>{entry.name}{entry.is_current_user ? ' (You)' : ''}</td>
                <td>{entry.referrals}</td>
                <td>{entry.rewards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
