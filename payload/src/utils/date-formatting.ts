/**
 * Returns the ordinal suffix for a day-of-month number (1 → "st", 2 → "nd", etc.).
 */
function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/**
 * Convert an ISO date string (YYYY-MM-DD) to a human-readable format.
 *
 * @example
 * humanizeDate('2026-04-20') // → "April 20th, 2026"
 * humanizeDate('2026-01-01') // → "January 1st, 2026"
 *
 * @param isoDate - Date string in YYYY-MM-DD format
 * @returns Human-readable date string, or the original string if parsing fails
 */
export function humanizeDate(isoDate: string): string {
  // Parse as UTC noon to avoid any timezone-shift edge cases
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();

  return `${month} ${day}${ordinalSuffix(day)}, ${year}`;
}
