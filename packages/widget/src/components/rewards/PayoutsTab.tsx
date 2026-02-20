/** @jsxImportSource preact */

import type { RedemptionEntry } from '../../types';

type RedeemTabProps = {
  availableRewards: number;
  pending: number;
  redemptions: RedemptionEntry[];
};

export function RedeemTab({ availableRewards, pending, redemptions }: RedeemTabProps) {
  return (
    <div class="fevo-ef-dash-redeem">
      {/* Balance Card */}
      <div class="fevo-ef-dash-balance-card">
        <div class="fevo-ef-dash-balance-row">
          <div>
            <div class="fevo-ef-dash-balance-label">Available Rewards</div>
            <div class="fevo-ef-dash-balance-value">{availableRewards}</div>
            {pending > 0 && (
              <div class="fevo-ef-dash-balance-pending">
                + {pending} pending
              </div>
            )}
          </div>
          <button class="fevo-ef-dash-payout-btn">Redeem Rewards</button>
        </div>
      </div>

      {/* Redeem Options */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Redeem For</h3>
        <div class="fevo-ef-dash-redeem-options">
          <div class="fevo-ef-dash-redeem-option">
            <span class="fevo-ef-dash-redeem-option-icon">🎟️</span>
            <div class="fevo-ef-dash-redeem-option-info">
              <div class="fevo-ef-dash-redeem-option-title">Ticket Discounts</div>
              <div class="fevo-ef-dash-redeem-option-desc">Apply rewards toward your next ticket purchase</div>
            </div>
          </div>
          <div class="fevo-ef-dash-redeem-option">
            <span class="fevo-ef-dash-redeem-option-icon">👕</span>
            <div class="fevo-ef-dash-redeem-option-info">
              <div class="fevo-ef-dash-redeem-option-title">Exclusive Merchandise</div>
              <div class="fevo-ef-dash-redeem-option-desc">Unlock limited-edition event merch</div>
            </div>
          </div>
          <div class="fevo-ef-dash-redeem-option">
            <span class="fevo-ef-dash-redeem-option-icon">⭐</span>
            <div class="fevo-ef-dash-redeem-option-info">
              <div class="fevo-ef-dash-redeem-option-title">VIP Experiences</div>
              <div class="fevo-ef-dash-redeem-option-desc">Backstage passes, meet & greets, priority entry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Redemption History */}
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
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.reward}</td>
                  <td>
                    <span class="fevo-ef-dash-type-pill">{r.type}</span>
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
