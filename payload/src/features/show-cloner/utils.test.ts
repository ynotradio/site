import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateRange,
  getDayName,
  formatDateShort,
  getDaysDifference,
  addDays,
  groupShowsByDate,
  getShowsInRange,
} from './utils';
import type { Show } from './types';

describe('Show Cloner Utilities', () => {
  describe('formatDate', () => {
    it('formats date with weekday, month, day, and year', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/Monday, Jan 15, 2024/);
    });

    it('handles different months', () => {
      const result = formatDate('2024-07-04');
      expect(result).toMatch(/Thursday, Jul 4, 2024/);
    });
  });

  describe('formatDateRange', () => {
    it('formats date range with abbreviated weekdays', () => {
      const result = formatDateRange('2024-01-15', '2024-01-21');
      expect(result).toMatch(/Mon, Jan 15 - Sun, Jan 21, 2024/);
    });

    it('handles cross-month ranges', () => {
      const result = formatDateRange('2024-01-28', '2024-02-03');
      expect(result).toMatch(/Sun, Jan 28 - Sat, Feb 3, 2024/);
    });

    it('handles single day (same start and end)', () => {
      const result = formatDateRange('2024-01-15', '2024-01-15');
      expect(result).toMatch(/Mon, Jan 15 - Mon, Jan 15, 2024/);
    });
  });

  describe('getDayName', () => {
    it('returns full day name for Monday', () => {
      expect(getDayName('2024-01-15')).toBe('Monday');
    });

    it('returns full day name for Friday', () => {
      expect(getDayName('2024-01-19')).toBe('Friday');
    });

    it('returns full day name for Sunday', () => {
      expect(getDayName('2024-01-21')).toBe('Sunday');
    });
  });

  describe('formatDateShort', () => {
    it('formats date without weekday', () => {
      const result = formatDateShort('2024-01-15');
      expect(result).toBe('Jan 15, 2024');
    });

    it('handles different months and years', () => {
      const result = formatDateShort('2025-12-31');
      expect(result).toBe('Dec 31, 2025');
    });
  });

  describe('getDaysDifference', () => {
    it('calculates difference for same day', () => {
      expect(getDaysDifference('2024-01-15', '2024-01-15')).toBe(0);
    });

    it('calculates difference for consecutive days', () => {
      expect(getDaysDifference('2024-01-15', '2024-01-16')).toBe(1);
    });

    it('calculates difference for one week', () => {
      expect(getDaysDifference('2024-01-15', '2024-01-22')).toBe(7);
    });

    it('calculates difference across months', () => {
      expect(getDaysDifference('2024-01-28', '2024-02-03')).toBe(6);
    });

    it('handles negative differences (end before start)', () => {
      expect(getDaysDifference('2024-01-22', '2024-01-15')).toBe(-7);
    });
  });

  describe('addDays', () => {
    it('adds days within same month', () => {
      expect(addDays('2024-01-15', 5)).toBe('2024-01-20');
    });

    it('adds days across month boundary', () => {
      expect(addDays('2024-01-28', 5)).toBe('2024-02-02');
    });

    it('adds days across year boundary', () => {
      expect(addDays('2024-12-30', 5)).toBe('2025-01-04');
    });

    it('adds zero days', () => {
      expect(addDays('2024-01-15', 0)).toBe('2024-01-15');
    });

    it('adds negative days (subtracts)', () => {
      expect(addDays('2024-01-15', -5)).toBe('2024-01-10');
    });

    it('handles leap year', () => {
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    });
  });

  describe('groupShowsByDate', () => {
    const mockShows: Show[] = [
      {
        id: '1',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '10:00',
        name: 'Morning Show',
      },
      {
        id: '2',
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '16:00',
        name: 'Afternoon Show',
      },
      {
        id: '3',
        date: '2024-01-16',
        startTime: '08:00',
        endTime: '10:00',
        name: 'Tuesday Show',
      },
    ];

    it('groups shows by date', () => {
      const result = groupShowsByDate(mockShows);
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].shows).toHaveLength(2);
      expect(result[1].date).toBe('2024-01-16');
      expect(result[1].shows).toHaveLength(1);
    });

    it('sorts groups by date ascending', () => {
      const unsorted: Show[] = [
        { id: '1', date: '2024-01-20', startTime: '08:00', endTime: '10:00' },
        { id: '2', date: '2024-01-15', startTime: '08:00', endTime: '10:00' },
        { id: '3', date: '2024-01-18', startTime: '08:00', endTime: '10:00' },
      ];
      const result = groupShowsByDate(unsorted);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-18');
      expect(result[2].date).toBe('2024-01-20');
    });

    it('includes formatted date and day name', () => {
      const result = groupShowsByDate(mockShows);
      expect(result[0].formattedDate).toMatch(/Monday, Jan 15, 2024/);
      expect(result[0].dayName).toBe('Monday');
    });

    it('handles empty array', () => {
      const result = groupShowsByDate([]);
      expect(result).toEqual([]);
    });

    it('handles single show', () => {
      const singleShow: Show[] = [
        { id: '1', date: '2024-01-15', startTime: '08:00', endTime: '10:00' },
      ];
      const result = groupShowsByDate(singleShow);
      expect(result).toHaveLength(1);
      expect(result[0].shows).toHaveLength(1);
    });
  });

  describe('getShowsInRange', () => {
    const mockShows: Show[] = [
      { id: '1', date: '2024-01-10', startTime: '08:00', endTime: '10:00' },
      { id: '2', date: '2024-01-15', startTime: '08:00', endTime: '10:00' },
      { id: '3', date: '2024-01-20', startTime: '08:00', endTime: '10:00' },
      { id: '4', date: '2024-01-25', startTime: '08:00', endTime: '10:00' },
      { id: '5', date: '2024-01-30', startTime: '08:00', endTime: '10:00' },
    ];

    it('filters shows within date range (inclusive)', () => {
      const result = getShowsInRange(mockShows, '2024-01-15', '2024-01-25');
      expect(result).toHaveLength(3);
      expect(result.map((s) => s.id)).toEqual(['2', '3', '4']);
    });

    it('includes boundary dates', () => {
      const result = getShowsInRange(mockShows, '2024-01-10', '2024-01-10');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array when no shows in range', () => {
      const result = getShowsInRange(mockShows, '2024-02-01', '2024-02-28');
      expect(result).toEqual([]);
    });

    it('returns all shows when range covers all dates', () => {
      const result = getShowsInRange(mockShows, '2024-01-01', '2024-12-31');
      expect(result).toHaveLength(5);
    });

    it('handles empty shows array', () => {
      const result = getShowsInRange([], '2024-01-01', '2024-12-31');
      expect(result).toEqual([]);
    });
  });
});
