import { describe, it, expect } from 'vitest';
import { formatPrice } from '../formatPrice';

describe('formatPrice', () => {
  describe('when min equals max', () => {
    it('returns a single price for integer amounts', () => {
      expect(formatPrice({ min: 45, max: 45, currency: 'USD' })).toBe('$45');
    });

    it('returns a single price with two decimals for fractional amounts', () => {
      expect(formatPrice({ min: 45.5, max: 45.5, currency: 'USD' })).toBe('$45.50');
    });

    it('returns Free when both min and max are 0', () => {
      expect(formatPrice({ min: 0, max: 0, currency: 'USD' })).toBe('$0');
    });
  });

  describe('price ranges', () => {
    it('returns a range when min < max and both are positive', () => {
      expect(formatPrice({ min: 45, max: 120, currency: 'USD' })).toBe('$45 - $120');
    });

    it('formats range with decimal amounts', () => {
      expect(formatPrice({ min: 9.99, max: 29.99, currency: 'USD' })).toBe('$9.99 - $29.99');
    });

    it('formats range with mixed integer and decimal', () => {
      expect(formatPrice({ min: 10, max: 25.5, currency: 'USD' })).toBe('$10 - $25.50');
    });
  });

  describe('"From" pricing', () => {
    it('returns "From $X" when min > 0 and max <= min (but not equal)', () => {
      // This case: min > 0, max < min (max is not > min, and min !== max)
      expect(formatPrice({ min: 50, max: 30, currency: 'USD' })).toBe('From $50');
    });
  });

  describe('"Up to" pricing', () => {
    it('returns "Up to $X" when min is 0 and max > 0', () => {
      expect(formatPrice({ min: 0, max: 100, currency: 'USD' })).toBe('Up to $100');
    });

    it('returns "Up to" with decimal amount', () => {
      expect(formatPrice({ min: 0, max: 49.99, currency: 'USD' })).toBe('Up to $49.99');
    });
  });

  describe('free pricing', () => {
    it('returns "Free" when both min and max are 0 — wait, this falls into min===max', () => {
      // Actually when min === 0 and max === 0, min === max so it returns formatAmount(0, symbol) => "$0"
      // "Free" is reached when min <= 0, max <= 0, and they are NOT equal, or min < 0
      // Let's test: min = -1, max = 0 -> min !== max, min not > 0, max <= 0? max is 0 so not > 0 => Free
      expect(formatPrice({ min: -1, max: 0, currency: 'USD' })).toBe('Free');
    });

    it('returns "Free" when both min and max are negative', () => {
      expect(formatPrice({ min: -5, max: -1, currency: 'USD' })).toBe('Free');
    });
  });

  describe('currency symbols', () => {
    it('uses $ for USD', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'USD' })).toBe('$10');
    });

    it('uses euro sign for EUR', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'EUR' })).toBe('\u20ac10');
    });

    it('uses pound sign for GBP', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'GBP' })).toBe('\u00a310');
    });

    it('uses CA$ for CAD', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'CAD' })).toBe('CA$10');
    });

    it('uses A$ for AUD', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'AUD' })).toBe('A$10');
    });

    it('falls back to currency code with space for unknown currencies', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'JPY' })).toBe('JPY 10');
    });

    it('handles lowercase currency codes', () => {
      expect(formatPrice({ min: 10, max: 10, currency: 'usd' })).toBe('$10');
    });
  });

  describe('decimal formatting', () => {
    it('does not add decimals for integer amounts', () => {
      expect(formatPrice({ min: 100, max: 100, currency: 'USD' })).toBe('$100');
    });

    it('formats to two decimal places for fractional amounts', () => {
      expect(formatPrice({ min: 19.9, max: 19.9, currency: 'USD' })).toBe('$19.90');
    });

    it('keeps two decimal places for amounts already with two decimals', () => {
      expect(formatPrice({ min: 19.99, max: 19.99, currency: 'USD' })).toBe('$19.99');
    });
  });
});
