/**
 * All widget styles as a single CSS string, injected at runtime.
 * All classes are prefixed with `fevo-ef-` to avoid conflicts with host pages.
 */

export const WIDGET_STYLES = `
/* ===== Reset & Container ===== */
.fevo-ef-root {
  --fevo-ef-bg: #ffffff;
  --fevo-ef-card-bg: #ffffff;
  --fevo-ef-text: #1a1a1a;
  --fevo-ef-text-secondary: #6b7280;
  --fevo-ef-border: #e5e7eb;
  --fevo-ef-accent: #4f46e5;
  --fevo-ef-accent-hover: #4338ca;
  --fevo-ef-skeleton-base: #e5e7eb;
  --fevo-ef-skeleton-shine: #f3f4f6;
  --fevo-ef-error-bg: #fef2f2;
  --fevo-ef-error-text: #991b1b;
  --fevo-ef-empty-text: #9ca3af;
  --fevo-ef-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --fevo-ef-shadow-hover: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --fevo-ef-radius: 12px;
  --fevo-ef-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  font-family: var(--fevo-ef-font);
  color: var(--fevo-ef-text);
  line-height: 1.5;
  box-sizing: border-box;
}

.fevo-ef-root *,
.fevo-ef-root *::before,
.fevo-ef-root *::after {
  box-sizing: border-box;
}

/* ===== Dark Theme ===== */
.fevo-ef-root[data-theme="dark"] {
  --fevo-ef-bg: #111827;
  --fevo-ef-card-bg: #1f2937;
  --fevo-ef-text: #f9fafb;
  --fevo-ef-text-secondary: #9ca3af;
  --fevo-ef-border: #374151;
  --fevo-ef-skeleton-base: #374151;
  --fevo-ef-skeleton-shine: #4b5563;
  --fevo-ef-error-bg: #450a0a;
  --fevo-ef-error-text: #fca5a5;
  --fevo-ef-empty-text: #6b7280;
  --fevo-ef-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --fevo-ef-shadow-hover: 0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2);
}

/* ===== Grid Layout ===== */
.fevo-ef-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, 1fr);
}

.fevo-ef-grid[data-columns="1"] { grid-template-columns: 1fr; }
.fevo-ef-grid[data-columns="2"] { grid-template-columns: repeat(2, 1fr); }
.fevo-ef-grid[data-columns="3"] { grid-template-columns: repeat(3, 1fr); }
.fevo-ef-grid[data-columns="4"] { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1024px) {
  .fevo-ef-grid[data-columns="3"],
  .fevo-ef-grid[data-columns="4"] {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fevo-ef-grid,
  .fevo-ef-grid[data-columns="2"],
  .fevo-ef-grid[data-columns="3"],
  .fevo-ef-grid[data-columns="4"] {
    grid-template-columns: 1fr;
  }
}

/* ===== Offer Card ===== */
.fevo-ef-card {
  background: var(--fevo-ef-card-bg);
  border-radius: var(--fevo-ef-radius);
  box-shadow: var(--fevo-ef-shadow);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  animation: fevo-ef-fade-in 0.3s ease-out;
}

.fevo-ef-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--fevo-ef-shadow-hover);
}

.fevo-ef-card-exit {
  animation: fevo-ef-fade-out 0.3s ease-out forwards;
}

.fevo-ef-card-image-wrap {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.fevo-ef-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fevo-ef-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.fevo-ef-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--fevo-ef-text);
  margin: 0 0 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.fevo-ef-card-meta {
  font-size: 13px;
  color: var(--fevo-ef-text-secondary);
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fevo-ef-card-meta-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

.fevo-ef-card-price {
  font-size: 16px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin: 8px 0;
}

/* ===== Reward Callout (Card Body) ===== */
.fevo-ef-rw-card-callout {
  background: #FFFDF0;
  border: 1px solid rgba(255, 204, 0, 0.4);
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-card-callout {
  background: #2a2714;
  border-color: rgba(184, 150, 10, 0.4);
}

.fevo-ef-rw-card-callout-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.fevo-ef-rw-card-callout-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #b8960a;
}

.fevo-ef-rw-card-callout-headline {
  font-size: 12px;
  font-weight: 700;
  color: #b8960a;
}

.fevo-ef-rw-card-callout-tiers {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fevo-ef-rw-card-callout-tier {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 11px;
  line-height: 1.3;
}

.fevo-ef-rw-card-callout-tier[data-tier-level="1"] {
  border-left-color: #d4a574;
  background: rgba(160, 113, 74, 0.06);
}
.fevo-ef-rw-card-callout-tier[data-tier-level="2"] {
  border-left-color: #94a3b8;
  background: rgba(100, 116, 139, 0.06);
}
.fevo-ef-rw-card-callout-tier[data-tier-level="3"] {
  border-left-color: #eab308;
  background: rgba(234, 179, 8, 0.06);
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-card-callout-tier[data-tier-level="1"] { background: rgba(160, 113, 74, 0.12); }
.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-card-callout-tier[data-tier-level="2"] { background: rgba(100, 116, 139, 0.12); }
.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-card-callout-tier[data-tier-level="3"] { background: rgba(234, 179, 8, 0.12); }

.fevo-ef-rw-card-callout-tier-label {
  font-weight: 700;
  white-space: nowrap;
}

.fevo-ef-rw-card-callout-tier[data-tier-level="1"] .fevo-ef-rw-card-callout-tier-label { color: #a0714a; }
.fevo-ef-rw-card-callout-tier[data-tier-level="2"] .fevo-ef-rw-card-callout-tier-label { color: #64748b; }
.fevo-ef-rw-card-callout-tier[data-tier-level="3"] .fevo-ef-rw-card-callout-tier-label { color: #a16207; }

.fevo-ef-rw-card-callout-tier-reward {
  color: var(--fevo-ef-text);
  font-weight: 500;
  text-align: right;
}

.fevo-ef-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
}

/* ===== Availability Badge ===== */
.fevo-ef-availability {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.fevo-ef-availability-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fevo-ef-availability-dot[data-status="available"] {
  background-color: #22c55e;
}

.fevo-ef-availability-dot[data-status="limited"] {
  background-color: #eab308;
}

.fevo-ef-availability-dot[data-status="sold_out"] {
  background-color: #9ca3af;
}

/* ===== CTA Button ===== */
.fevo-ef-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--fevo-ef-accent);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.fevo-ef-cta:hover {
  background-color: var(--fevo-ef-accent-hover);
}

.fevo-ef-cta[data-status="sold_out"] {
  background-color: #9ca3af;
  cursor: not-allowed;
  pointer-events: none;
}

/* ===== Skeleton Card ===== */
.fevo-ef-skeleton {
  background: var(--fevo-ef-card-bg);
  border-radius: var(--fevo-ef-radius);
  box-shadow: var(--fevo-ef-shadow);
  overflow: hidden;
}

.fevo-ef-skeleton-block {
  background: var(--fevo-ef-skeleton-base);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.fevo-ef-skeleton-block::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--fevo-ef-skeleton-shine) 50%,
    transparent 100%
  );
  animation: fevo-ef-shimmer 1.5s infinite;
}

.fevo-ef-skeleton-image {
  width: 100%;
  height: 200px;
  border-radius: 0;
}

.fevo-ef-skeleton-body {
  padding: 16px;
}

.fevo-ef-skeleton-title {
  height: 20px;
  width: 80%;
  margin-bottom: 12px;
}

.fevo-ef-skeleton-line {
  height: 14px;
  margin-bottom: 8px;
}

.fevo-ef-skeleton-line-short {
  width: 60%;
}

.fevo-ef-skeleton-line-medium {
  width: 75%;
}

.fevo-ef-skeleton-btn {
  height: 36px;
  width: 110px;
  margin-top: 12px;
  border-radius: 8px;
}

/* ===== Error State ===== */
.fevo-ef-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.fevo-ef-state-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  color: var(--fevo-ef-text-secondary);
}

.fevo-ef-state-message {
  font-size: 15px;
  color: var(--fevo-ef-text-secondary);
  margin: 0 0 16px 0;
  max-width: 320px;
}

.fevo-ef-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--fevo-ef-accent);
  background: transparent;
  border: 2px solid var(--fevo-ef-accent);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-retry-btn:hover {
  background-color: var(--fevo-ef-accent);
  color: #ffffff;
}

/* ===== Powered By FEVO ===== */
.fevo-ef-powered-by {
  text-align: center;
  padding: 16px 0 4px 0;
  font-size: 11px;
  color: var(--fevo-ef-text-secondary);
  letter-spacing: 0.02em;
  opacity: 0.7;
}

.fevo-ef-powered-by a {
  color: var(--fevo-ef-text-secondary);
  text-decoration: none;
}

.fevo-ef-powered-by a:hover {
  text-decoration: underline;
}

/* ===== Refreshing Indicator ===== */
.fevo-ef-refreshing-bar {
  height: 2px;
  background: var(--fevo-ef-accent);
  animation: fevo-ef-progress 1.5s ease-in-out infinite;
  border-radius: 1px;
  margin-bottom: 16px;
}

/* ===== Animations ===== */
@keyframes fevo-ef-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fevo-ef-fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@keyframes fevo-ef-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes fevo-ef-progress {
  0% { width: 0%; margin-left: 0%; }
  50% { width: 60%; margin-left: 20%; }
  100% { width: 0%; margin-left: 100%; }
}

/* ===== Offer Detail Modal ===== */
.fevo-ef-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fevo-ef-backdrop-in 0.2s ease-out;
  padding: 24px;
}

@keyframes fevo-ef-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fevo-ef-modal {
  position: relative;
  background: var(--fevo-ef-card-bg);
  border-radius: var(--fevo-ef-radius);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: fevo-ef-modal-in 0.25s ease-out;
  display: flex;
  flex-direction: column;
}

@keyframes fevo-ef-modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.fevo-ef-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-modal-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.fevo-ef-modal-hero {
  width: 100%;
  height: 280px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

.fevo-ef-modal-hero img,
.fevo-ef-modal-hero video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fevo-ef-modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.fevo-ef-modal-org {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.fevo-ef-modal-org-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.fevo-ef-modal-org-name {
  font-size: 13px;
  color: var(--fevo-ef-text-secondary);
  font-weight: 500;
}

.fevo-ef-modal-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.fevo-ef-modal-meta {
  font-size: 14px;
  color: var(--fevo-ef-text-secondary);
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fevo-ef-modal-meta-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

.fevo-ef-modal-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin: 12px 0;
}

.fevo-ef-modal-description {
  font-size: 14px;
  color: var(--fevo-ef-text-secondary);
  line-height: 1.6;
  margin: 16px 0;
  white-space: pre-line;
}

.fevo-ef-modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.fevo-ef-modal-tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--fevo-ef-accent);
  background: color-mix(in srgb, var(--fevo-ef-accent) 10%, transparent);
  border-radius: 999px;
}

.fevo-ef-modal-footer {
  position: sticky;
  bottom: 0;
  padding: 16px 24px;
  border-top: 1px solid var(--fevo-ef-border);
  background: var(--fevo-ef-card-bg);
  flex-shrink: 0;
}

.fevo-ef-modal-footer .fevo-ef-cta {
  width: 100%;
  padding: 12px 24px;
  font-size: 16px;
  text-align: center;
}

/* ===== Modal Mobile Bottom Sheet ===== */
@media (max-width: 640px) {
  .fevo-ef-modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .fevo-ef-modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: var(--fevo-ef-radius) var(--fevo-ef-radius) 0 0;
    animation: fevo-ef-sheet-up 0.3s ease-out;
  }

  .fevo-ef-modal-hero {
    height: 220px;
  }
}

@keyframes fevo-ef-sheet-up {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Reward Badge (Card) ===== */
.fevo-ef-rw-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
  z-index: 2;
  pointer-events: none;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.fevo-ef-rw-badge-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ===== Reward Section (Modal) ===== */
.fevo-ef-rw-section {
  background: #FFFDF0;
  border: 1.5px solid #FFCC00;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-section {
  background: #2a2714;
  border-color: #b8960a;
}

.fevo-ef-rw-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin-bottom: 8px;
}

.fevo-ef-rw-header-icon {
  width: 18px;
  height: 18px;
  color: #b8960a;
  flex-shrink: 0;
}

.fevo-ef-rw-rule {
  font-size: 13px;
  color: var(--fevo-ef-text-secondary);
  margin-bottom: 14px;
}

/* Milestones */
.fevo-ef-rw-milestones {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.fevo-ef-rw-milestone {
  flex: 1;
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
  border: 1.5px solid;
  cursor: pointer;
  transition: opacity 0.15s ease, box-shadow 0.15s ease;
}

.fevo-ef-rw-milestone:hover {
  opacity: 0.85;
}

.fevo-ef-rw-milestone[data-selected] {
  box-shadow: 0 0 0 2px var(--fevo-ef-text);
}

/* Tier 1 — Bronze */
.fevo-ef-rw-milestone[data-tier-level="1"] {
  background: #fdf6ee;
  border-color: #d4a574;
}
.fevo-ef-rw-milestone[data-tier-level="1"] .fevo-ef-rw-milestone-tier { color: #a0714a; }

/* Tier 2 — Silver */
.fevo-ef-rw-milestone[data-tier-level="2"] {
  background: #f0f4f8;
  border-color: #94a3b8;
}
.fevo-ef-rw-milestone[data-tier-level="2"] .fevo-ef-rw-milestone-tier { color: #64748b; }

/* Tier 3 — Gold */
.fevo-ef-rw-milestone[data-tier-level="3"] {
  background: #fefce8;
  border-color: #eab308;
}
.fevo-ef-rw-milestone[data-tier-level="3"] .fevo-ef-rw-milestone-tier { color: #a16207; }

/* Dark theme tier overrides */
.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-milestone[data-tier-level="1"] {
  background: #2a2114; border-color: #8b6a42;
}
.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-milestone[data-tier-level="2"] {
  background: #1e2430; border-color: #64748b;
}
.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-milestone[data-tier-level="3"] {
  background: #2a2714; border-color: #ca8a04;
}

.fevo-ef-rw-milestone-tier {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 2px;
}

.fevo-ef-rw-milestone-threshold {
  font-size: 10px;
  color: var(--fevo-ef-text-secondary);
  margin-bottom: 4px;
}

.fevo-ef-rw-milestone-reward {
  font-size: 11px;
  font-weight: 600;
  color: var(--fevo-ef-text);
}

/* Progress bar */
.fevo-ef-rw-progress {
  margin-bottom: 14px;
}

.fevo-ef-rw-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fevo-ef-text-secondary);
  margin-bottom: 6px;
}

.fevo-ef-rw-progress-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.fevo-ef-rw-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFCC00, #f59e0b);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* CTA prompt — encourages purchase to unlock share link */
.fevo-ef-rw-cta-prompt {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 204, 0, 0.12);
  border: 1px dashed #FFCC00;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #b8960a;
  line-height: 1.4;
}

.fevo-ef-rw-cta-prompt-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #b8960a;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-cta-prompt {
  background: rgba(255, 204, 0, 0.08);
  border-color: #b8960a;
  color: #FFCC00;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-cta-prompt-icon {
  color: #FFCC00;
}

/* ===== Reward Detail Panel ===== */
.fevo-ef-rw-detail {
  display: flex;
  gap: 14px;
  padding: 14px;
  margin-bottom: 14px;
  border-radius: 8px;
  border-left: 4px solid #d4a574;
  background: var(--fevo-ef-card-bg);
  border-top: 1px solid var(--fevo-ef-border);
  border-right: 1px solid var(--fevo-ef-border);
  border-bottom: 1px solid var(--fevo-ef-border);
  animation: fevo-ef-fade-in 0.2s ease-out;
}

.fevo-ef-rw-detail[data-tier-level="1"] { border-left-color: #d4a574; }
.fevo-ef-rw-detail[data-tier-level="2"] { border-left-color: #94a3b8; }
.fevo-ef-rw-detail[data-tier-level="3"] { border-left-color: #eab308; }

.fevo-ef-rw-detail-img {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  cursor: zoom-in;
  transition: opacity 0.15s ease;
}

.fevo-ef-rw-detail-img:hover {
  opacity: 0.85;
}

.fevo-ef-rw-detail-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fevo-ef-rw-detail-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--fevo-ef-text);
}

.fevo-ef-rw-detail-threshold {
  font-size: 11px;
  color: var(--fevo-ef-text-secondary);
}

.fevo-ef-rw-detail-reward {
  font-size: 13px;
  font-weight: 600;
  color: #b8960a;
}

.fevo-ef-rw-detail-desc {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
  line-height: 1.4;
  margin-top: 4px;
}

/* ===== Reward Image Lightbox ===== */
.fevo-ef-rw-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  animation: fevo-ef-backdrop-in 0.15s ease-out;
  padding: 24px;
}

.fevo-ef-rw-lightbox-img {
  max-width: 90%;
  max-height: 85vh;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  object-fit: contain;
  animation: fevo-ef-modal-in 0.2s ease-out;
}

/* ===== Rewards Dashboard (Page) ===== */

.fevo-ef-dash-page {
  max-width: 860px;
  margin: 0 auto;
}

/* Header */
.fevo-ef-dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--fevo-ef-border);
  background: var(--fevo-ef-card-bg);
  flex-shrink: 0;
}

.fevo-ef-dash-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fevo-ef-dash-header-logo {
  background: #FFCC00;
  color: #1a1a1a;
  font-size: 12px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: -0.3px;
}

.fevo-ef-dash-header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--fevo-ef-text);
}

.fevo-ef-dash-header-user {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
}

/* Tabs */
.fevo-ef-dash-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--fevo-ef-border);
  background: var(--fevo-ef-card-bg);
  flex-shrink: 0;
  padding: 0 24px;
}

.fevo-ef-dash-tab {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--fevo-ef-text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-dash-tab:hover {
  color: var(--fevo-ef-text);
}

.fevo-ef-dash-tab.active {
  color: #FFCC00;
  border-bottom-color: #FFCC00;
}

/* Content */
.fevo-ef-dash-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ===== How Rewards Work — Gradient Banner ===== */
.fevo-ef-dash-how-banner {
  background: linear-gradient(135deg, #f59e0b 0%, #FFCC00 50%, #fbbf24 100%);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.fevo-ef-dash-how-banner-head {
  margin-bottom: 4px;
}

.fevo-ef-dash-how-banner-title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 4px;
}

.fevo-ef-dash-how-banner-sub {
  font-size: 13px;
  opacity: 0.8;
}

.fevo-ef-dash-how-banner-body {
  margin-top: 16px;
}

.fevo-ef-dash-how-steps {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.fevo-ef-dash-how-step {
  flex: 1;
  text-align: center;
}

.fevo-ef-dash-how-step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #FFCC00;
  font-size: 15px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.fevo-ef-dash-how-step-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
}

.fevo-ef-dash-how-step-desc {
  font-size: 11px;
  opacity: 0.7;
  line-height: 1.4;
}

.fevo-ef-dash-how-connector {
  width: 40px;
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  margin-top: 18px;
  flex-shrink: 0;
}

.fevo-ef-dash-how-banner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.fevo-ef-dash-how-get-started {
  padding: 8px 22px;
  font-size: 13px;
  font-weight: 700;
  background: #1a1a1a;
  color: #FFCC00;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--fevo-ef-font);
  transition: background 0.12s;
}

.fevo-ef-dash-how-get-started:hover {
  background: #333;
}

.fevo-ef-dash-how-collapse {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--fevo-ef-font);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ===== Activity Ticker ===== */
.fevo-ef-dash-ticker {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 10px 0;
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
}

.fevo-ef-dash-ticker-track {
  display: flex;
  gap: 32px;
  white-space: nowrap;
  animation: fevo-ef-ticker-scroll 30s linear infinite;
}

.fevo-ef-dash-ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #d1d5db;
  flex-shrink: 0;
}

.fevo-ef-dash-ticker-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

.fevo-ef-dash-ticker-time {
  color: #6b7280;
}

@keyframes fevo-ef-ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Stats Row */
.fevo-ef-dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.fevo-ef-dash-stat-card {
  background: var(--fevo-ef-card-bg);
  border: 1px solid var(--fevo-ef-border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.fevo-ef-dash-stat-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--fevo-ef-text);
  margin-bottom: 4px;
}

.fevo-ef-dash-stat-total { color: #22c55e; }
.fevo-ef-dash-stat-pending { color: #eab308; }
.fevo-ef-dash-stat-redeemed { color: var(--fevo-ef-text); }

.fevo-ef-dash-stat-label {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
  font-weight: 500;
}

/* Sections */
.fevo-ef-dash-section {
  margin-bottom: 24px;
}

.fevo-ef-dash-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.fevo-ef-dash-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin: 0 0 12px 0;
}

.fevo-ef-dash-section-header .fevo-ef-dash-section-title {
  margin-bottom: 0;
}

/* Charts */
.fevo-ef-dash-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 160px;
  padding: 0 4px;
}

.fevo-ef-dash-chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.fevo-ef-dash-chart-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin-bottom: 4px;
  white-space: nowrap;
}

.fevo-ef-dash-chart-bar-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.fevo-ef-dash-chart-bar {
  width: 100%;
  background: linear-gradient(180deg, #FFCC00, #f59e0b);
  border-radius: 6px 6px 0 0;
  min-height: 4px;
  transition: height 0.4s ease;
}

.fevo-ef-dash-chart-label {
  font-size: 11px;
  color: var(--fevo-ef-text-secondary);
  margin-top: 6px;
  font-weight: 500;
}

/* Featured Program */
.fevo-ef-dash-featured {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFDF0;
  border: 1.5px solid #FFCC00;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-dash-featured {
  background: #2a2714;
  border-color: #b8960a;
}

.fevo-ef-dash-featured-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #FFCC00;
  color: #1a1a1a;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fevo-ef-dash-featured-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin-bottom: 3px;
}

.fevo-ef-dash-featured-meta {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
}

/* Programs */
.fevo-ef-dash-program {
  background: var(--fevo-ef-card-bg);
  border: 1px solid var(--fevo-ef-border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.fevo-ef-dash-program-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.fevo-ef-dash-program-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--fevo-ef-text);
}

.fevo-ef-dash-reward-type-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fevo-ef-dash-program-tier {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.fevo-ef-dash-tier-badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255, 204, 0, 0.15);
  color: #b8960a;
  border-radius: 999px;
}

.fevo-ef-dash-program-refs {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
}

.fevo-ef-dash-program-progress {
  margin-bottom: 4px;
}

.fevo-ef-dash-program-progress-track {
  height: 8px;
  background: var(--fevo-ef-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.fevo-ef-dash-program-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFCC00, #f59e0b);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.fevo-ef-dash-program-progress-label {
  font-size: 11px;
  color: var(--fevo-ef-text-secondary);
}

.fevo-ef-dash-program-progress-label em {
  font-style: normal;
  color: #b8960a;
  font-weight: 600;
}

/* Achievements */
.fevo-ef-dash-ach-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--fevo-ef-text-secondary);
  background: var(--fevo-ef-border);
  padding: 3px 10px;
  border-radius: 999px;
}

.fevo-ef-dash-achievements {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.fevo-ef-dash-achievement {
  background: var(--fevo-ef-card-bg);
  border: 1px solid var(--fevo-ef-border);
  border-radius: 10px;
  padding: 16px 10px 12px;
  text-align: center;
  position: relative;
}

.fevo-ef-dash-achievement.unlocked {
  background: #FFFDF0;
  border-color: #FFCC00;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-dash-achievement.unlocked {
  background: #2a2714;
  border-color: #b8960a;
}

.fevo-ef-dash-achievement.locked {
  opacity: 0.55;
}

.fevo-ef-dash-achievement-icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 6px;
}

.fevo-ef-dash-achievement-icon {
  font-size: 32px;
  line-height: 1;
}

.fevo-ef-dash-achievement-lock {
  position: absolute;
  top: -4px;
  right: -10px;
  font-size: 12px;
}

.fevo-ef-dash-achievement-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin-bottom: 2px;
}

.fevo-ef-dash-achievement-date {
  font-size: 10px;
  color: var(--fevo-ef-text-secondary);
}

.fevo-ef-dash-achievement-desc {
  font-size: 10px;
  color: var(--fevo-ef-text-secondary);
  line-height: 1.3;
}

/* Leaderboard */
.fevo-ef-dash-lb-toggle {
  display: flex;
  gap: 4px;
  background: var(--fevo-ef-border);
  border-radius: 6px;
  padding: 2px;
}

.fevo-ef-dash-lb-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--fevo-ef-text-secondary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--fevo-ef-font);
  transition: all 0.12s;
}

.fevo-ef-dash-lb-btn.active {
  background: var(--fevo-ef-card-bg);
  color: var(--fevo-ef-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.fevo-ef-dash-lb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.fevo-ef-dash-lb-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--fevo-ef-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--fevo-ef-border);
}

.fevo-ef-dash-lb-table td {
  padding: 10px 12px;
  color: var(--fevo-ef-text);
  border-bottom: 1px solid var(--fevo-ef-border);
}

.fevo-ef-dash-lb-table tr:last-child td {
  border-bottom: none;
}

.fevo-ef-dash-lb-me {
  background: rgba(255, 204, 0, 0.08);
}

.fevo-ef-dash-lb-me td {
  font-weight: 700;
}

/* Tables */
.fevo-ef-dash-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.fevo-ef-dash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.fevo-ef-dash-table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--fevo-ef-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--fevo-ef-border);
  white-space: nowrap;
}

.fevo-ef-dash-table td {
  padding: 10px 12px;
  color: var(--fevo-ef-text);
  border-bottom: 1px solid var(--fevo-ef-border);
  white-space: nowrap;
}

.fevo-ef-dash-table tr:last-child td {
  border-bottom: none;
}

.fevo-ef-dash-ref {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 11px;
}

.fevo-ef-dash-reward-cell {
  font-weight: 600;
  color: #b8960a;
}

/* Status Badges */
.fevo-ef-dash-status {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  text-transform: capitalize;
}

.fevo-ef-dash-status-pending {
  background: rgba(234, 179, 8, 0.12);
  color: #b8960a;
}

.fevo-ef-dash-status-confirmed {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.fevo-ef-dash-status-redeemed,
.fevo-ef-dash-status-completed {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.fevo-ef-dash-status-processing {
  background: rgba(234, 179, 8, 0.12);
  color: #b8960a;
}

.fevo-ef-dash-status-failed {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

/* Type Pill */
.fevo-ef-dash-type-pill {
  display: inline-block;
  padding: 2px 10px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  text-transform: capitalize;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
}

/* Balance Card */
.fevo-ef-dash-balance-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  color: #fff;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-dash-balance-card {
  background: linear-gradient(135deg, #FFCC00 0%, #f59e0b 100%);
  color: #1a1a1a;
}

.fevo-ef-dash-balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.fevo-ef-dash-balance-label {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.fevo-ef-dash-balance-value {
  font-size: 40px;
  font-weight: 800;
}

.fevo-ef-dash-balance-pending {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
}

.fevo-ef-dash-payout-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 700;
  background: #FFCC00;
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-dash-payout-btn:hover {
  background: #e6b800;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-dash-payout-btn {
  background: #1a1a1a;
  color: #FFCC00;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-dash-payout-btn:hover {
  background: #333;
}

/* Redeem Options */
.fevo-ef-dash-redeem-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fevo-ef-dash-redeem-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--fevo-ef-card-bg);
  border: 1px solid var(--fevo-ef-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}

.fevo-ef-dash-redeem-option:hover {
  border-color: #FFCC00;
  box-shadow: 0 0 0 1px #FFCC00;
}

.fevo-ef-dash-redeem-option-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.fevo-ef-dash-redeem-option-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--fevo-ef-text);
  margin-bottom: 2px;
}

.fevo-ef-dash-redeem-option-desc {
  font-size: 12px;
  color: var(--fevo-ef-text-secondary);
}

/* ===== Dashboard Mobile ===== */
@media (max-width: 640px) {
  .fevo-ef-dash-content {
    padding: 16px;
  }

  .fevo-ef-dash-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .fevo-ef-dash-achievements {
    grid-template-columns: repeat(2, 1fr);
  }

  .fevo-ef-dash-how-steps {
    flex-direction: column;
    gap: 8px;
  }

  .fevo-ef-dash-how-connector {
    display: none;
  }

  .fevo-ef-dash-balance-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .fevo-ef-dash-balance-value {
    font-size: 30px;
  }

  .fevo-ef-dash-payout-btn {
    width: 100%;
    text-align: center;
  }
}
`;

let injected = false;

/**
 * Inject the widget stylesheet into the document head.
 * Called once on first widget render; subsequent calls are no-ops.
 */
export function injectStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-fevo-ef', '');
  style.textContent = WIDGET_STYLES;
  document.head.appendChild(style);
  injected = true;
}
