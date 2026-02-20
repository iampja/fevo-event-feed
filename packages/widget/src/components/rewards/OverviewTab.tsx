/** @jsxImportSource preact */

import { useState } from 'preact/hooks';
import type { UserLifetimeStats, UserProgramProgress, Achievement, LeaderboardEntry } from '../../types';

type OverviewTabProps = {
  stats: UserLifetimeStats;
  programs: UserProgramProgress[];
  achievements: Achievement[];
  leaderboardMonth: LeaderboardEntry[];
  leaderboardAllTime: LeaderboardEntry[];
};

export function OverviewTab({
  stats,
  programs,
  achievements,
  leaderboardMonth,
  leaderboardAllTime,
}: OverviewTabProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [lbPeriod, setLbPeriod] = useState<'month' | 'alltime'>('month');

  const leaderboard = lbPeriod === 'month' ? leaderboardMonth : leaderboardAllTime;

  return (
    <div class="fevo-ef-dash-overview">
      {/* Stats Row */}
      <div class="fevo-ef-dash-stats">
        <div class="fevo-ef-dash-stat-card">
          <div class="fevo-ef-dash-stat-value">${stats.total_earned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div class="fevo-ef-dash-stat-label">Total Earned</div>
        </div>
        <div class="fevo-ef-dash-stat-card">
          <div class="fevo-ef-dash-stat-value fevo-ef-dash-stat-pending">${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div class="fevo-ef-dash-stat-label">Pending</div>
        </div>
        <div class="fevo-ef-dash-stat-card">
          <div class="fevo-ef-dash-stat-value fevo-ef-dash-stat-paid">${stats.paid_out.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div class="fevo-ef-dash-stat-label">Paid Out</div>
        </div>
        <div class="fevo-ef-dash-stat-card">
          <div class="fevo-ef-dash-stat-value">{stats.active_programs}</div>
          <div class="fevo-ef-dash-stat-label">Active Programs</div>
        </div>
      </div>

      {/* How Rewards Work */}
      <div class="fevo-ef-dash-how">
        <button
          class="fevo-ef-dash-how-toggle"
          onClick={() => setHowItWorksOpen(!howItWorksOpen)}
        >
          <span class="fevo-ef-dash-how-toggle-icon">{howItWorksOpen ? '▾' : '▸'}</span>
          How Rewards Work
        </button>
        {howItWorksOpen && (
          <div class="fevo-ef-dash-how-content">
            <div class="fevo-ef-dash-how-steps">
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">1</div>
                <div class="fevo-ef-dash-how-step-title">Share Link</div>
                <div class="fevo-ef-dash-how-step-desc">Copy your unique referral link and share it with friends</div>
              </div>
              <div class="fevo-ef-dash-how-arrow">→</div>
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">2</div>
                <div class="fevo-ef-dash-how-step-title">Friends Buy</div>
                <div class="fevo-ef-dash-how-step-desc">When they purchase tickets through your link, it counts</div>
              </div>
              <div class="fevo-ef-dash-how-arrow">→</div>
              <div class="fevo-ef-dash-how-step">
                <div class="fevo-ef-dash-how-step-num">3</div>
                <div class="fevo-ef-dash-how-step-title">You Earn</div>
                <div class="fevo-ef-dash-how-step-desc">Earn rewards for every successful referral, with tier bonuses</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Programs */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Active Programs</h3>
        {programs.map((prog) => {
          const nextMilestone = prog.milestones.find((m) => m.tier === prog.current_tier + 1);
          const currentMilestone = prog.milestones.find((m) => m.tier === prog.current_tier);
          const prevThreshold = prog.milestones.find((m) => m.tier === prog.current_tier - 1)?.threshold ?? 0;
          const nextThreshold = nextMilestone?.threshold ?? prog.referrals;
          const progressPct = nextMilestone
            ? Math.min(100, ((prog.referrals - prevThreshold) / (nextThreshold - prevThreshold)) * 100)
            : 100;

          return (
            <div key={prog.program_id} class="fevo-ef-dash-program">
              <div class="fevo-ef-dash-program-header">
                <div class="fevo-ef-dash-program-name">{prog.program_name}</div>
                <div class="fevo-ef-dash-program-earned">${prog.earned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div class="fevo-ef-dash-program-tier">
                <span class="fevo-ef-dash-tier-badge">{currentMilestone?.label ?? `Tier ${prog.current_tier}`}</span>
                <span class="fevo-ef-dash-program-refs">{prog.referrals} referrals · {prog.tickets_sold} tickets</span>
              </div>
              <div class="fevo-ef-dash-program-progress">
                <div class="fevo-ef-dash-program-progress-track">
                  <div
                    class="fevo-ef-dash-program-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {nextMilestone && (
                  <div class="fevo-ef-dash-program-progress-label">
                    {nextThreshold - prog.referrals} more to {nextMilestone.label}
                  </div>
                )}
              </div>
              {prog.recent_referrals.length > 0 && (
                <div class="fevo-ef-dash-program-referrals">
                  {prog.recent_referrals.map((ref, i) => (
                    <div key={i} class="fevo-ef-dash-referral-row">
                      <span class="fevo-ef-dash-referral-name">{ref.name}</span>
                      <span class="fevo-ef-dash-referral-detail">{ref.tickets} tickets · {ref.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Achievements</h3>
        <div class="fevo-ef-dash-achievements">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              class={`fevo-ef-dash-achievement ${ach.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div class="fevo-ef-dash-achievement-icon">{ach.icon}</div>
              <div class="fevo-ef-dash-achievement-title">{ach.title}</div>
              <div class="fevo-ef-dash-achievement-desc">{ach.description}</div>
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
              <th>Earned</th>
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
                <td>${entry.earned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
