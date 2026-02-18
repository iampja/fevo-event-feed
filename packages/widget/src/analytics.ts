import type { AnalyticsEvent } from './types';

const isDev =
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'production';

/**
 * Core event tracking function.
 * - In development: logs to console.
 * - Always: dispatches a CustomEvent on window so partner sites can listen.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (isDev) {
    console.log('[FevoEventFeed Analytics]', event.type, event.data);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('fevo:analytics', {
        detail: event,
      }),
    );
  } catch {
    // Silently ignore if CustomEvent is not supported (very old browsers)
  }
}

export function trackWidgetLoaded(
  segment: string | undefined,
  offerCount: number,
): void {
  trackEvent({
    type: 'widget_loaded',
    data: {
      segment: segment ?? 'default',
      offer_count: offerCount,
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackOfferViewed(offerId: string): void {
  trackEvent({
    type: 'offer_card_viewed',
    data: {
      offer_id: offerId,
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackOfferClicked(
  offerId: string,
  segment: string | undefined,
  partnerId: string | undefined,
): void {
  trackEvent({
    type: 'offer_card_clicked',
    data: {
      offer_id: offerId,
      segment: segment ?? 'default',
      partner_id: partnerId ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackWidgetError(
  errorType: string,
  segment: string | undefined,
): void {
  trackEvent({
    type: 'widget_error',
    data: {
      error_type: errorType,
      segment: segment ?? 'default',
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackOfferDetailOpened(offerId: string): void {
  trackEvent({
    type: 'offer_detail_opened',
    data: {
      offer_id: offerId,
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackWidgetRefreshed(added: number, removed: number): void {
  trackEvent({
    type: 'widget_refreshed',
    data: {
      offers_added: added,
      offers_removed: removed,
      timestamp: new Date().toISOString(),
    },
  });
}
