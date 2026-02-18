import type { DateValue } from '../types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a date value into a human-readable format.
 * Accepts either an ISO date string or a { utc, timezone, display } object.
 * Example: "2026-04-15T19:00:00Z" -> "Apr 15, 2026 \u00b7 7:00 PM"
 */
export function formatDate(value: DateValue): string {
  // Handle date object from transformer
  if (typeof value === 'object' && value !== null) {
    // If a display string is provided, use it directly
    if (value.display) {
      return value.display;
    }
    // Fall back to formatting the UTC value
    if (value.utc) {
      return formatIsoString(value.utc);
    }
    return '';
  }

  // Handle plain ISO string (backward compat)
  return formatIsoString(value);
}

function formatIsoString(isoString: string): string {
  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return isoString;
    }

    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();

    const hours24 = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    const minuteStr = minutes.toString().padStart(2, '0');

    return `${month} ${day}, ${year} \u00b7 ${hours12}:${minuteStr} ${ampm}`;
  } catch {
    return isoString;
  }
}
