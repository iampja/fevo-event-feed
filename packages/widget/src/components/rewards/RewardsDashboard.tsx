/** @jsxImportSource preact */

import { useEffect, useCallback, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { OverviewTab } from './OverviewTab';
import { HistoryTab } from './HistoryTab';
import { RedeemTab } from './PayoutsTab';
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

type Tab = 'overview' | 'history' | 'redeem';

type RewardsDashboardProps = {
  theme: 'light' | 'dark';
  onClose: () => void;
};

export function RewardsDashboard({ theme, onClose }: RewardsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Create a portal container on document.body
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (!portalRef.current) {
    portalRef.current = document.createElement('div');
    portalRef.current.className = 'fevo-ef-root';
    portalRef.current.setAttribute('data-theme', theme);
  }

  useEffect(() => {
    const el = portalRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handlePanelClick = useCallback((e: Event) => {
    e.stopPropagation();
  }, []);

  const availableRewards = MOCK_STATS.total_rewards - MOCK_STATS.redeemed - MOCK_STATS.pending;

  return createPortal(
    <div class="fevo-ef-dash-backdrop" onClick={handleBackdropClick}>
      <div
        class="fevo-ef-dash-panel"
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-label="My FEVO"
      >
        {/* Header */}
        <div class="fevo-ef-dash-header">
          <div class="fevo-ef-dash-header-left">
            <div class="fevo-ef-dash-header-logo">FEVO</div>
            <div>
              <div class="fevo-ef-dash-header-title">My FEVO</div>
              <div class="fevo-ef-dash-header-user">{MOCK_USER.name}</div>
            </div>
          </div>
          <button class="fevo-ef-dash-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
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
            class={`fevo-ef-dash-tab ${activeTab === 'redeem' ? 'active' : ''}`}
            onClick={() => setActiveTab('redeem')}
          >
            Redeem
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
          {activeTab === 'redeem' && (
            <RedeemTab
              availableRewards={availableRewards}
              pending={MOCK_STATS.pending}
              redemptions={MOCK_REDEMPTIONS}
            />
          )}
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
