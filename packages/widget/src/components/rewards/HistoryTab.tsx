/** @jsxImportSource preact */

import type { EarningHistoryEntry, MonthlyEarning } from '../../types';

type HistoryTabProps = {
  earnings: EarningHistoryEntry[];
  monthlyEarnings: MonthlyEarning[];
};

export function HistoryTab({ earnings, monthlyEarnings }: HistoryTabProps) {
  const maxMonthly = Math.max(...monthlyEarnings.map((m) => m.amount), 1);

  return (
    <div class="fevo-ef-dash-history">
      {/* Monthly Chart */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Monthly Earnings</h3>
        <div class="fevo-ef-dash-chart">
          {monthlyEarnings.map((m) => (
            <div key={m.month} class="fevo-ef-dash-chart-col">
              <div class="fevo-ef-dash-chart-value">${m.amount}</div>
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

      {/* Earnings Table */}
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Earnings History</h3>
        <div class="fevo-ef-dash-table-wrap">
          <table class="fevo-ef-dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Referral</th>
                <th>Tickets</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.event}</td>
                  <td>{entry.referral_name}</td>
                  <td>{entry.tickets}</td>
                  <td>${entry.amount.toFixed(2)}</td>
                  <td>
                    <span class={`fevo-ef-dash-status fevo-ef-dash-status-${entry.status}`}>
                      {entry.status}
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
