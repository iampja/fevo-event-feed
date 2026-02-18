import type { Offer, WidgetConfig } from '../types';

export function buildCheckoutUrl(offer: Offer, config: WidgetConfig): string {
  try {
    const url = new URL(offer.checkout_url);
    url.searchParams.set('source', 'widget');
    if (config.segment) {
      url.searchParams.set('segment', config.segment);
    }
    if (config.partnerId) {
      url.searchParams.set('partner', config.partnerId);
    }
    return url.toString();
  } catch {
    // If checkout_url is a relative path or malformed, return as-is with query params
    const separator = offer.checkout_url.includes('?') ? '&' : '?';
    let params = `source=widget`;
    if (config.segment) params += `&segment=${encodeURIComponent(config.segment)}`;
    if (config.partnerId) params += `&partner=${encodeURIComponent(config.partnerId)}`;
    return `${offer.checkout_url}${separator}${params}`;
  }
}
