/** @jsxImportSource preact */

import { useState } from 'preact/hooks';
import { OverviewTab } from './OverviewTab';
import { HistoryTab } from './HistoryTab';
import { MyRewardsTab } from './PayoutsTab';
import {
  MOCK_USER,
  MOCK_STATS,
  MOCK_PROGRAMS,
  MOCK_ACTIVITY_FEED,
  MOCK_EARNINGS,
  MOCK_MONTHLY_REWARDS,
  MOCK_REDEMPTIONS,
  MOCK_ACHIEVEMENTS,
  LEADERBOARD_MONTH,
  LEADERBOARD_ALL_TIME,
} from '../../data/mockRewardsData';

type Tab = 'overview' | 'history' | 'myrewards';

type RewardsDashboardProps = {
  theme?: 'light' | 'dark';
};

export function RewardsDashboard({ theme = 'light' }: RewardsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div class="fevo-ef-root fevo-ef-dash-page" data-theme={theme}>
      {/* Header */}
      <div class="fevo-ef-dash-header">
        <div class="fevo-ef-dash-header-left">
          <div class="fevo-ef-dash-header-logo">FEVO</div>
          <div>
            <div class="fevo-ef-dash-header-title">My FEVO</div>
            <div class="fevo-ef-dash-header-user">{MOCK_USER.name}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div class="fevo-ef-dash-tabs">
        <button
          class={`fevo-ef-dash-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          class={`fevo-ef-dash-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          class={`fevo-ef-dash-tab ${activeTab === 'myrewards' ? 'active' : ''}`}
          onClick={() => setActiveTab('myrewards')}
        >
          My Rewards
        </button>
      </div>

      {/* Tab Content */}
      <div class="fevo-ef-dash-content">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={MOCK_STATS}
            programs={MOCK_PROGRAMS}
            activityFeed={MOCK_ACTIVITY_FEED}
            monthlyRewards={MOCK_MONTHLY_REWARDS}
            achievements={MOCK_ACHIEVEMENTS}
            leaderboardMonth={LEADERBOARD_MONTH}
            leaderboardAllTime={LEADERBOARD_ALL_TIME}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab earnings={MOCK_EARNINGS} />
        )}
        {activeTab === 'myrewards' && (
          <MyRewardsTab rewards={MOCK_REDEMPTIONS} />
        )}
      </div>
    </div>
  );
}
