import { describe, it, expect } from 'vitest';
import {
  STATION_TIME_ZONE,
  stationCalendarDate,
  stationTodayNoonUTC,
  stationTodayNoonUTCPlusMonths,
} from './stationDate';

describe('stationDate', () => {
  it('uses Eastern time as the station timezone', () => {
    expect(STATION_TIME_ZONE).toBe('America/New_York');
  });

  describe('stationCalendarDate', () => {
    it('returns the Eastern calendar date during the day', () => {
      expect(stationCalendarDate(new Date('2026-08-11T15:30:00Z'))).toBe('2026-08-11');
    });

    it('stays on the current Eastern day after UTC has rolled over (EDT)', () => {
      // 2026-08-11T01:00Z is still 2026-08-10, 9:00pm in Philadelphia.
      expect(stationCalendarDate(new Date('2026-08-11T01:00:00Z'))).toBe('2026-08-10');
    });

    it('stays on the current Eastern day after UTC has rolled over (EST)', () => {
      // Standard time is UTC-5, so the rollover gap runs 00:00–05:00Z.
      expect(stationCalendarDate(new Date('2026-01-15T04:30:00Z'))).toBe('2026-01-14');
    });

    it('advances at Eastern midnight, not UTC midnight', () => {
      expect(stationCalendarDate(new Date('2026-08-11T03:59:00Z'))).toBe('2026-08-10');
      expect(stationCalendarDate(new Date('2026-08-11T04:00:00Z'))).toBe('2026-08-11');
    });

    it('zero-pads single-digit months and days', () => {
      expect(stationCalendarDate(new Date('2026-03-05T17:00:00Z'))).toBe('2026-03-05');
    });
  });

  describe('stationTodayNoonUTC', () => {
    it('returns noon UTC on the Eastern calendar day', () => {
      expect(stationTodayNoonUTC(new Date('2026-08-11T15:30:00Z')).toISOString()).toBe(
        '2026-08-11T12:00:00.000Z',
      );
    });

    it('does not jump a day ahead late in the Eastern evening', () => {
      expect(stationTodayNoonUTC(new Date('2026-08-11T01:00:00Z')).toISOString()).toBe(
        '2026-08-10T12:00:00.000Z',
      );
    });

    it('matches the stamp of a noon-normalized show on the same day', () => {
      // Shows are stored at noon UTC by normalizeFieldToNoon, so a
      // greater_than_equal against this boundary includes today's shows.
      const boundary = stationTodayNoonUTC(new Date('2026-08-10T23:00:00Z'));
      const todaysShow = new Date('2026-08-10T12:00:00.000Z');
      expect(todaysShow.getTime()).toBeGreaterThanOrEqual(boundary.getTime());
    });
  });

  describe('stationTodayNoonUTCPlusMonths', () => {
    it('shifts backwards by whole months', () => {
      expect(
        stationTodayNoonUTCPlusMonths(-6, new Date('2026-08-11T15:30:00Z')).toISOString(),
      ).toBe('2026-02-11T12:00:00.000Z');
    });

    it('crosses the year boundary', () => {
      expect(
        stationTodayNoonUTCPlusMonths(-6, new Date('2026-03-20T15:30:00Z')).toISOString(),
      ).toBe('2025-09-20T12:00:00.000Z');
    });

    it('shifts forwards for positive values', () => {
      expect(stationTodayNoonUTCPlusMonths(1, new Date('2026-08-11T15:30:00Z')).toISOString()).toBe(
        '2026-09-11T12:00:00.000Z',
      );
    });
  });
});
