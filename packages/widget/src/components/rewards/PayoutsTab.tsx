/** @jsxImportSource preact */

import type { PayoutEntry } from '../../types';

type PayoutsTabProps = {
  balance: number;
  pending: number;
  paymentMethod: string;
  payouts: PayoutEntry[];
};

export function PayoutsTab({ balance, pending, paymentMethod, payouts }: PayoutsTabProps) {
  return (
    <div class="fevo-ef-dash-payouts">
      {/* Balance Card */}
      <div class="fevo-ef-dash-balance-card">
        <div class="fevo-ef-dash-balance-row">
          <div>
            <div class="fevo-ef-dash-balance-label">Available Balance</div>
            <div class="fevo-ef-dash-balance-value">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {pending > 0 && (
              <div class="fevo-ef-dash-balance-pending">
                + ${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending
              </div>
            )}
          </div>
          <button class="fevo-ef-dash-payout-btn">Request Payout</button>
        </div>
      </div>

      {/* Payment Method */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Payment Method</h3>
        <div class="fevo-ef-dash-payment-method">
          <span class="fevo-ef-dash-payment-icon">💳</span>
          <span>{paymentMethod}</span>
        </div>
      </div>

      {/* Payout History */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Payout History</h3>
        <div class="fevo-ef-dash-table-wrap">
          <table class="fevo-ef-dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.date}</td>
                  <td>${payout.amount.toFixed(2)}</td>
                  <td>{payout.method}</td>
                  <td class="fevo-ef-dash-ref">{payout.reference}</td>
                  <td>
                    <span class={`fevo-ef-dash-status fevo-ef-dash-status-${payout.status}`}>
                      {payout.status}
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
