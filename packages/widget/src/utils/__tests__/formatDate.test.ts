import { describe, it, expect } from 'vitest';
import { formatDate } from '../formatDate';

describe('formatDate', () => {
  it('formats a standard UTC date correctly', () => {
    // Note: the function uses local time via Date methods (getMonth, getDate, etc.).
    // We construct expected output based on what `new Date(...)` produces locally.
    const date = new Date('2026-04-15T19:00:00Z');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const expected = `${month} ${day}, ${year} \u00b7 ${hours12}:${minutes} ${ampm}`;
    expect(formatDate('2026-04-15T19:00:00Z')).toBe(expected);
  });

  it('formats a midnight date correctly', () => {
    const date = new Date('2025-01-01T00:00:00Z');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const expected = `${month} ${day}, ${year} \u00b7 ${hours12}:${minutes} ${ampm}`;
    expect(formatDate('2025-01-01T00:00:00Z')).toBe(expected);
  });

  it('formats a noon date correctly', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const expected = `${month} ${day}, ${year} \u00b7 ${hours12}:${minutes} ${ampm}`;
    expect(formatDate('2025-06-15T12:00:00Z')).toBe(expected);
  });

  it('returns the original string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('returns the original string for an empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('handles date strings with timezone offsets', () => {
    const isoString = '2025-12-31T23:30:00+05:00';
    const date = new Date(isoString);
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const expected = `${month} ${day}, ${year} \u00b7 ${hours12}:${minutes} ${ampm}`;
    expect(formatDate(isoString)).toBe(expected);
  });

  it('includes leading zero in minutes for single-digit minutes', () => {
    const date = new Date('2025-03-10T14:05:00Z');
    const result = formatDate('2025-03-10T14:05:00Z');
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    expect(result).toContain(`${hours12}:05`);
  });

  it('produces the correct format structure with middle dot separator', () => {
    const result = formatDate('2026-07-04T20:30:00Z');
    // Should contain the middle dot separator
    expect(result).toContain('\u00b7');
    // Should match the overall pattern: "Mon D, YYYY . H:MM AM/PM"
    expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \u00b7 \d{1,2}:\d{2} (AM|PM)$/);
  });
});
