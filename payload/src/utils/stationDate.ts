/**
 * Station-local date helpers for admin list filters.
 *
 * Two facts have to line up for a "today onward" filter to work:
 *
 * 1. Y-Not Radio runs on Eastern time. `new Date()` on a server is UTC, and
 *    UTC rolls over to the next day at 8pm ET (7pm during standard time), so
 *    a UTC-derived "today" is a day ahead for the last four hours of every
 *    Eastern day.
 * 2. Date-only fields (`shows.date`, `concerts.date`, `posts.startDate`, …)
 *    are stored at noon UTC — see `normalizeFieldToNoon` in
 *    `payload/src/collections/hooks/showDateHooks.ts`. A boundary at midnight
 *    UTC therefore sits *after* the stamp of the day it is supposed to
 *    include, silently dropping that day from the list.
 *
 * Building the boundary from the station's calendar day at noon UTC satisfies
 * both: `date >= stationTodayNoonUTC()` matches today's rows exactly (the
 * stamps are equal) and everything after, all day long.
 *
 * This mirrors what the public PHP site already does in SQL:
 * `(s.date AT TIME ZONE 'America/New_York')::date
 *    >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date`
 */

export const STATION_TIME_ZONE = 'America/New_York';

/** The station's calendar date (`YYYY-MM-DD`) at a given instant. */
export function stationCalendarDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: STATION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * Noon UTC on the station's current calendar day — the boundary to compare
 * noon-normalized date fields against.
 */
export function stationTodayNoonUTC(now: Date = new Date()): Date {
  const [year, month, day] = stationCalendarDate(now).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

/**
 * Noon UTC on the station's current calendar day, shifted by whole months.
 * Negative values go back in time (e.g. `-6` for a six-month lookback).
 */
export function stationTodayNoonUTCPlusMonths(months: number, now: Date = new Date()): Date {
  const date = stationTodayNoonUTC(now);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
}
