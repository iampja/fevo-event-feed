type PriceInfo = {
  min: number;
  max: number;
  currency: string;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20ac',
  GBP: '\u00a3',
  CAD: 'CA$',
  AUD: 'A$',
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || `${currency} `;
}

function formatAmount(amount: number, symbol: string): string {
  if (Number.isInteger(amount)) {
    return `${symbol}${amount}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Formats a price range for display.
 * - If min === max: "$45"
 * - If min < max: "$45 - $120"
 * - If only min > 0: "From $45"
 */
export function formatPrice(price: PriceInfo): string {
  const symbol = getCurrencySymbol(price.currency);

  if (price.min === price.max) {
    return formatAmount(price.min, symbol);
  }

  if (price.min > 0 && price.max > price.min) {
    return `${formatAmount(price.min, symbol)} - ${formatAmount(price.max, symbol)}`;
  }

  if (price.min > 0) {
    return `From ${formatAmount(price.min, symbol)}`;
  }

  if (price.max > 0) {
    return `Up to ${formatAmount(price.max, symbol)}`;
  }

  return 'Free';
}
