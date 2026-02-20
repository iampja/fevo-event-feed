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
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  z-index: 2;
  pointer-events: none;
}

.fevo-ef-rw-badge-icon {
  width: 12px;
  height: 12px;
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
  background: rgba(255, 204, 0, 0.1);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 8px;
  padding: 10px 8px;
  text-align: center;
}

.fevo-ef-rw-milestone-tier {
  font-size: 12px;
  font-weight: 700;
  color: #b8960a;
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

/* Copy link */
.fevo-ef-rw-copy {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.fevo-ef-rw-copy-input {
  flex: 1;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  color: #333;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-copy-input {
  background: var(--fevo-ef-card-bg);
  color: var(--fevo-ef-text);
  border-color: var(--fevo-ef-border);
}

.fevo-ef-rw-copy-btn {
  height: 34px;
  padding: 0 14px;
  background: #FFCC00;
  color: #1a1a1a;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
  font-family: var(--fevo-ef-font);
}

.fevo-ef-rw-copy-btn:hover {
  background: #e6b800;
}

.fevo-ef-rw-copy-btn.copied {
  background: #22c55e;
  color: #fff;
}

/* Social share */
.fevo-ef-rw-social {
  display: flex;
  gap: 8px;
}

.fevo-ef-rw-social-btn {
  flex: 1;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #4b5563;
  transition: all 0.12s;
  text-decoration: none;
}

.fevo-ef-rw-social-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.fevo-ef-rw-social-btn svg {
  width: 14px;
  height: 14px;
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-social-btn {
  background: var(--fevo-ef-card-bg);
  color: var(--fevo-ef-text-secondary);
  border-color: var(--fevo-ef-border);
}

.fevo-ef-root[data-theme="dark"] .fevo-ef-rw-social-btn:hover {
  background: rgba(255, 255, 255, 0.05);
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
