/** @jsxImportSource preact */

import { useState } from 'preact/hooks';
import type { Reward } from '../types';

type RewardSectionProps = {
  reward: Reward;
  offerTitle: string;
};

export function RewardSection({ reward, offerTitle }: RewardSectionProps) {
  const maxThreshold = reward.milestones[reward.milestones.length - 1].threshold;
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const handleTierClick = (index: number) => {
    setSelectedTier(selectedTier === index ? null : index);
  };

  const selected = selectedTier !== null ? reward.milestones[selectedTier] : null;
  const selectedLevel = selectedTier !== null ? selectedTier + 1 : 0;

  return (
    <div class="fevo-ef-rw-section">
      <div class="fevo-ef-rw-header">
        <svg class="fevo-ef-rw-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7h6s2-3 4.5-3a2.5 2.5 0 0 1 0 5H18" />
          <path d="M5 9h14v2a7 7 0 0 1-14 0V9z" />
          <path d="M12 9v12" />
        </svg>
        Share &amp; Earn
      </div>

      <div class="fevo-ef-rw-rule">
        <strong>{reward.headline}</strong> — share your link and earn rewards when friends buy
      </div>

      {/* Milestone tiers */}
      <div class="fevo-ef-rw-milestones">
        {reward.milestones.map((m, i) => (
          <div
            key={m.tier}
            class="fevo-ef-rw-milestone"
            data-tier-level={i + 1}
            data-selected={selectedTier === i ? '' : undefined}
            onClick={() => handleTierClick(i)}
          >
            <div class="fevo-ef-rw-milestone-tier">{m.label}</div>
            <div class="fevo-ef-rw-milestone-threshold">{m.threshold} sold</div>
            <div class="fevo-ef-rw-milestone-reward">{m.reward}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div class="fevo-ef-rw-detail" data-tier-level={selectedLevel}>
          {selected.image_url && (
            <img class="fevo-ef-rw-detail-img" src={selected.image_url} alt={selected.label} />
          )}
          <div class="fevo-ef-rw-detail-body">
            <div class="fevo-ef-rw-detail-label">{selected.label}</div>
            <div class="fevo-ef-rw-detail-threshold">{selected.threshold} tickets sold</div>
            <div class="fevo-ef-rw-detail-reward">{selected.reward}</div>
            {selected.description && (
              <div class="fevo-ef-rw-detail-desc">{selected.description}</div>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div class="fevo-ef-rw-progress">
        <div class="fevo-ef-rw-progress-label">
          <span>0 tickets sold</span>
          <span>{maxThreshold} for {reward.milestones[reward.milestones.length - 1].label}</span>
        </div>
        <div class="fevo-ef-rw-progress-track">
          <div class="fevo-ef-rw-progress-fill" style={{ width: '0%' }} />
        </div>
      </div>

      {/* CTA prompt — share link is delivered post-purchase */}
      <div class="fevo-ef-rw-cta-prompt">
        <svg class="fevo-ef-rw-cta-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 5l-1 1" />
          <path d="M2 12h6" />
          <path d="M18.5 20a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
          <path d="M8.5 20a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
          <path d="M7.44 4.94l.82 4.18A2 2 0 0 0 10.22 11h6.56a2 2 0 0 0 1.96-1.61L20 4H6.27a1 1 0 0 0-1 .84z" />
          <path d="M10.22 11L9 20h8l-1.22-9" />
        </svg>
        Buy tickets to get your personal share link and start earning rewards
      </div>
    </div>
  );
}
