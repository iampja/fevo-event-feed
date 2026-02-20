/** @jsxImportSource preact */

import { useCallback, useState } from 'preact/hooks';
import type { Reward } from '../types';

type RewardSectionProps = {
  reward: Reward;
  offerTitle: string;
};

export function RewardSection({ reward, offerTitle }: RewardSectionProps) {
  const [copied, setCopied] = useState(false);

  // Mock referral URL — in production this would come from the API
  const referralUrl = `https://fevo.me/r/${reward.program_id}`;

  const maxThreshold = reward.milestones[reward.milestones.length - 1].threshold;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback: select the input
    });
  }, [referralUrl]);

  const shareText = encodeURIComponent(`Check out ${offerTitle}! Get tickets:`);
  const encodedUrl = encodeURIComponent(referralUrl);

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
        {reward.milestones.map((m) => (
          <div key={m.tier} class="fevo-ef-rw-milestone">
            <div class="fevo-ef-rw-milestone-tier">{m.label}</div>
            <div class="fevo-ef-rw-milestone-threshold">{m.threshold} tickets</div>
            <div class="fevo-ef-rw-milestone-reward">{m.reward}</div>
          </div>
        ))}
      </div>

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

      {/* Copy link */}
      <div class="fevo-ef-rw-copy">
        <input class="fevo-ef-rw-copy-input" readonly value={referralUrl} />
        <button
          class={`fevo-ef-rw-copy-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Social sharing */}
      <div class="fevo-ef-rw-social">
        <a
          class="fevo-ef-rw-social-btn"
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
          X
        </a>
        <a
          class="fevo-ef-rw-social-btn"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          Facebook
        </a>
        <a
          class="fevo-ef-rw-social-btn"
          href={`sms:?body=${shareText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" /></svg>
          SMS
        </a>
        <a
          class="fevo-ef-rw-social-btn"
          href={`mailto:?subject=${shareText}&body=${shareText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
          Email
        </a>
      </div>
    </div>
  );
}
