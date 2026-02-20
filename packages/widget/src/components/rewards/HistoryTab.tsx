/** @jsxImportSource preact */

import type { EarningHistoryEntry } from '../../types';

type HistoryTabProps = {
  earnings: EarningHistoryEntry[];
};

export function HistoryTab({ earnings }: HistoryTabProps) {
  return (
    <div class="fevo-ef-dash-history">
      <div class="fevo-ef-dash-section">
        <h3 class="fevo-ef-dash-section-title">Reward History</h3>
        <div class="fevo-ef-dash-table-wrap">
          <table class="fevo-ef-dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Event</th>
                <th>Referral</th>
                <th>Tickets</th>
                <th>Reward</th>
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
                  <td class="fevo-ef-dash-reward-cell">{entry.reward}</td>
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
