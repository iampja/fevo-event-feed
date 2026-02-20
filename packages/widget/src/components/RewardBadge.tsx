/** @jsxImportSource preact */

import type { Reward, RewardType } from '../types';

const REWARD_COLORS: Record<RewardType, string> = {
  money: '#22c55e',
  points: '#a855f7',
  discount: '#eab308',
  merchandise: '#f97316',
};

function RewardIcon({ type }: { type: RewardType }) {
  switch (type) {
    case 'money':
      return (
        <svg class="fevo-ef-rw-badge-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z" />
        </svg>
      );
    case 'points':
      return (
        <svg class="fevo-ef-rw-badge-icon" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'discount':
      return (
        <svg class="fevo-ef-rw-badge-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
        </svg>
      );
    case 'merchandise':
      return (
        <svg class="fevo-ef-rw-badge-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.05 0-1.95.56-2.47 1.38L12 4.44l-.53-1.06A2.997 2.997 0 0 0 9 2C7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4 15.38 12 17 10.83 14.92 8H20v6z" />
        </svg>
      );
  }
}

type RewardBadgeProps = {
  reward: Reward;
};

export function RewardBadge({ reward }: RewardBadgeProps) {
  const color = REWARD_COLORS[reward.type] || REWARD_COLORS.money;

  return (
    <div class="fevo-ef-rw-badge" style={{ color }}>
      <RewardIcon type={reward.type} />
      <span>{reward.headline}</span>
    </div>
  );
}
