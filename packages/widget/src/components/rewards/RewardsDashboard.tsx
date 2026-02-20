/** @jsxImportSource preact */

import { useEffect, useCallback, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { OverviewTab } from './OverviewTab';
import { HistoryTab } from './HistoryTab';
import { PayoutsTab } from './PayoutsTab';
import {
  MOCK_USER,
  MOCK_STATS,
  MOCK_PROGRAMS,
  MOCK_EARNINGS,
  MOCK_MONTHLY_EARNINGS,
  MOCK_PAYOUTS,
  MOCK_ACHIEVEMENTS,
  LEADERBOARD_MONTH,
  LEADERBOARD_ALL_TIME,
} from '../../data/mockRewardsData';

type Tab = 'overview' | 'history' | 'payouts';

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

  // Available balance = total_earned - paid_out - pending (confirmed but not yet paid)
  const availableBalance = MOCK_STATS.total_earned - MOCK_STATS.paid_out - MOCK_STATS.pending;

  return createPortal(
    <div class="fevo-ef-dash-backdrop" onClick={handleBackdropClick}>
      <div
        class="fevo-ef-dash-panel"
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
        aria-label="My FEVO Rewards"
      >
        {/* Header */}
        <div class="fevo-ef-dash-header">
          <div class="fevo-ef-dash-header-left">
            <div class="fevo-ef-dash-header-logo">FEVO</div>
            <div>
              <div class="fevo-ef-dash-header-title">My Rewards</div>
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
            class={`fevo-ef-dash-tab ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </button>
        </div>

        {/* Tab Content */}
        <div class="fevo-ef-dash-content">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={MOCK_STATS}
              programs={MOCK_PROGRAMS}
              achievements={MOCK_ACHIEVEMENTS}
              leaderboardMonth={LEADERBOARD_MONTH}
              leaderboardAllTime={LEADERBOARD_ALL_TIME}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab
              earnings={MOCK_EARNINGS}
              monthlyEarnings={MOCK_MONTHLY_EARNINGS}
            />
          )}
          {activeTab === 'payouts' && (
            <PayoutsTab
              balance={availableBalance}
              pending={MOCK_STATS.pending}
              paymentMethod={`PayPal (${MOCK_USER.email})`}
              payouts={MOCK_PAYOUTS}
            />
          )}
        </div>
      </div>
    </div>,
    portalRef.current!,
  );
}
