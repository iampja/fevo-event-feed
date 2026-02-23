/** @jsxImportSource preact */

import type { RedemptionEntry, TierRewardType } from '../../types';

const TIER_ICONS: Record<TierRewardType, string> = { cash: '💵', merchandise: '👕', experience: '⭐' };

type MyRewardsTabProps = {
  rewards: RedemptionEntry[];
};

export function MyRewardsTab({ rewards }: MyRewardsTabProps) {
  const cashCount = rewards.filter((r) => r.type === 'cash').length;
  const merchCount = rewards.filter((r) => r.type === 'merchandise').length;
  const expCount = rewards.filter((r) => r.type === 'experience').length;

  return (
    <div class="fevo-ef-dash-redeem">
      {/* Reward Summary Cards */}
      <div class="fevo-ef-dash-reward-summary">
        <div class="fevo-ef-dash-reward-summary-card" data-reward-type="cash">
          <div class="fevo-ef-dash-reward-summary-icon">💵</div>
          <div class="fevo-ef-dash-reward-summary-value">{cashCount}</div>
          <div class="fevo-ef-dash-reward-summary-label">Cash Rewards</div>
        </div>
        <div class="fevo-ef-dash-reward-summary-card" data-reward-type="merchandise">
          <div class="fevo-ef-dash-reward-summary-icon">👕</div>
          <div class="fevo-ef-dash-reward-summary-value">{merchCount}</div>
          <div class="fevo-ef-dash-reward-summary-label">Merch Rewards</div>
        </div>
        <div class="fevo-ef-dash-reward-summary-card" data-reward-type="experience">
          <div class="fevo-ef-dash-reward-summary-icon">⭐</div>
          <div class="fevo-ef-dash-reward-summary-value">{expCount}</div>
          <div class="fevo-ef-dash-reward-summary-label">Experiences</div>
        </div>
      </div>

      {/* Fulfillment List */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Your Rewards</h3>
        <div class="fevo-ef-dash-reward-list">
          {rewards.map((r) => (
            <div key={r.id} class="fevo-ef-dash-reward-item">
              <span class="fevo-ef-dash-reward-item-icon">{TIER_ICONS[r.type]}</span>
              <div class="fevo-ef-dash-reward-item-info">
                <div class="fevo-ef-dash-reward-item-name">{r.reward}</div>
                <div class="fevo-ef-dash-reward-item-meta">{r.date} · {r.reference}</div>
              </div>
              <span class={`fevo-ef-dash-status fevo-ef-dash-status-${r.status}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Redemption History Table */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Redemption History</h3>
        <div class="fevo-ef-dash-table-wrap">
          <table class="fevo-ef-dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reward</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.reward}</td>
                  <td>
                    <span class="fevo-ef-dash-type-pill" data-reward-type={r.type}>{r.type}</span>
                  </td>
                  <td class="fevo-ef-dash-ref">{r.reference}</td>
                  <td>
                    <span class={`fevo-ef-dash-status fevo-ef-dash-status-${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
