import { render, h } from 'preact';
import { WidgetContainer } from './components/WidgetContainer';
import { MarketplacePage } from './components/MarketplacePage';
import { OfferPage } from './components/OfferPage';
import { RewardsDashboard } from './components/rewards/RewardsDashboard';
import { injectStyles } from './styles';
import type { WidgetConfig } from './types';

/**
 * Parse data-* attributes from an HTML element into a WidgetConfig.
 */
function parseConfigFromElement(el: Element): WidgetConfig {
  const config: WidgetConfig = {};

  const segment = el.getAttribute('data-segment');
  if (segment) config.segment = segment;

  const theme = el.getAttribute('data-theme') as 'light' | 'dark' | null;
  if (theme === 'light' || theme === 'dark') config.theme = theme;

  const columns = el.getAttribute('data-columns');
  if (columns) {
    const parsed = parseInt(columns, 10);
    if (parsed >= 1 && parsed <= 4) config.columns = parsed as 1 | 2 | 3 | 4;
  }

  const maxCards = el.getAttribute('data-max-cards');
  if (maxCards) {
    const parsed = parseInt(maxCards, 10);
    if (parsed > 0) config.maxCards = parsed;
  }

  const apiUrl = el.getAttribute('data-api-url');
  if (apiUrl) config.apiUrl = apiUrl;

  const apiKey = el.getAttribute('data-api-key');
  if (apiKey) config.apiKey = apiKey;

  const partnerId = el.getAttribute('data-partner-id');
  if (partnerId) config.partnerId = partnerId;

  const geo = el.getAttribute('data-geo');
  if (geo) config.geo = geo;

  const mode = el.getAttribute('data-mode') as 'feed' | 'marketplace' | 'offer' | null;
  if (mode) config.mode = mode;

  const offerId = el.getAttribute('data-offer-id');
  if (offerId) config.offerId = offerId;

  const signupUrl = el.getAttribute('data-signup-url');
  if (signupUrl) config.signupUrl = signupUrl;

  return config;
}

/**
 * Render a widget instance into a target element.
 */
function renderWidget(el: Element, config: WidgetConfig): void {
  if (config.mode === 'marketplace') {
    render(h(MarketplacePage, { config }), el);
  } else if (config.mode === 'offer' && config.offerId) {
    render(h(OfferPage, { offerId: config.offerId, config }), el);
  } else {
    render(h(WidgetContainer, { config }), el);
  }
}

/**
 * Auto-detect and initialize widgets from DOM elements.
 * Looks for:
 *   - Elements with id="fevo-event-feed"
 *   - Elements with class="fevo-event-feed"
 */
function autoInit(): void {
  const targets = new Set<Element>();

  // By ID
  const byId = document.getElementById('fevo-event-feed');
  if (byId) targets.add(byId);

  // By class
  const byClass = document.querySelectorAll('.fevo-event-feed');
  byClass.forEach((el) => targets.add(el));

  targets.forEach((el) => {
    const config = parseConfigFromElement(el);
    renderWidget(el, config);
  });

  // Auto-init My FEVO pages
  const myFevoTargets = document.querySelectorAll('.fevo-my-fevo');
  myFevoTargets.forEach((el) => {
    const theme = (el.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    injectStyles();
    render(h(RewardsDashboard, { theme }), el);
  });
}

/**
 * Programmatic initialization.
 */
function init(config: WidgetConfig, target?: Element | string): void {
  let el: Element | null = null;

  if (target) {
    if (typeof target === 'string') {
      el = document.querySelector(target);
    } else {
      el = target;
    }
  }

  if (el) {
    // Merge data-* attributes with programmatic config (programmatic takes precedence)
    const dataConfig = parseConfigFromElement(el);
    const merged: WidgetConfig = { ...dataConfig, ...config };
    renderWidget(el, merged);
  } else {
    // If no target specified, find all matching elements and render with provided config
    const targets = new Set<Element>();
    const byId = document.getElementById('fevo-event-feed');
    if (byId) targets.add(byId);
    document
      .querySelectorAll('.fevo-event-feed')
      .forEach((node) => targets.add(node));

    targets.forEach((node) => {
      const dataConfig = parseConfigFromElement(node);
      const merged: WidgetConfig = { ...dataConfig, ...config };
      renderWidget(node, merged);
    });
  }
}

/**
 * Destroy a widget instance from a target element.
 */
function destroy(target: Element | string): void {
  let el: Element | null = null;
  if (typeof target === 'string') {
    el = document.querySelector(target);
  } else {
    el = target;
  }
  if (el) {
    render(null, el);
  }
}

/**
 * Render the My FEVO rewards dashboard into a target element.
 */
function renderMyFevo(target: Element | string, theme?: 'light' | 'dark'): void {
  let el: Element | null = null;
  if (typeof target === 'string') {
    el = document.querySelector(target);
  } else {
    el = target;
  }
  if (el) {
    const resolvedTheme = theme || (el.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    injectStyles();
    render(h(RewardsDashboard, { theme: resolvedTheme }), el);
  }
}

// Public API exposed as a global
const FevoEventFeed = {
  init,
  destroy,
  renderMyFevo,
  version: '1.0.0',
};

// Expose as global for programmatic access (needed in dev mode where module
// exports aren't available on window, and matches the IIFE build behaviour)
if (typeof window !== 'undefined') {
  (window as any).FevoEventFeed = FevoEventFeed;
}

// Auto-init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already ready, defer to next microtask so host page can configure
    Promise.resolve().then(autoInit);
  }
}

export default FevoEventFeed;
export { init, destroy, renderMyFevo };
export type { WidgetConfig, Offer, FeedResponse, AnalyticsEvent } from './types';
