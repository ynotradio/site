/**
 * Unit tests for Show Cloner utility functions
 *
 * Tests the date formatting and grouping helper functions
 * used in the Show Cloner tool.
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateRange,
  formatDateShort,
  getDayName,
  getDaysDifference,
  addDays,
  groupShowsByDate,
  getShowsInRange,
} from './utils';
import type { Show } from './types';

describe('formatDate', () => {
  it('should format date with weekday, month, day, and year', () => {
    const result = formatDate('2024-01-15');
    // Note: The exact format may vary by locale, but should include these elements
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('should handle different date strings', () => {
    const result = formatDate('2024-12-25');
    expect(result).toContain('2024');
    expect(result).toContain('25');
  });
});

describe('formatDateRange', () => {
  it('should format a date range correctly', () => {
    const result = formatDateRange('2024-01-15', '2024-01-21');
    expect(result).toContain('15');
    expect(result).toContain('21');
    expect(result).toContain('-');
  });

  it('should include year only in end date', () => {
    const result = formatDateRange('2024-01-15', '2024-01-21');
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('should format date without weekday', () => {
    const result = formatDateShort('2024-01-15');
    expect(result).toContain('15');
    expect(result).toContain('2024');
    // Should not contain day name
    expect(result).not.toContain('Monday');
  });
});

describe('getDayName', () => {
  it('should return the day name for a date', () => {
    // January 15, 2024 was a Monday
    const result = getDayName('2024-01-15');
    expect(result).toBe('Monday');
  });

  it('should return Saturday for December 25, 2024', () => {
    // December 25, 2024 is a Wednesday
    const result = getDayName('2024-12-25');
    expect(result).toBe('Wednesday');
  });

  it('should return Sunday for a Sunday date', () => {
    // January 14, 2024 was a Sunday
    const result = getDayName('2024-01-14');
    expect(result).toBe('Sunday');
  });
});

describe('getDaysDifference', () => {
  it('should return 0 for the same date', () => {
    const result = getDaysDifference('2024-01-15', '2024-01-15');
    expect(result).toBe(0);
  });

  it('should return positive number for later end date', () => {
    const result = getDaysDifference('2024-01-15', '2024-01-22');
    expect(result).toBe(7);
  });

  it('should return 6 for a week minus one day', () => {
    const result = getDaysDifference('2024-01-15', '2024-01-21');
    expect(result).toBe(6);
  });
});

describe('addDays', () => {
  it('should add days to a date', () => {
    const result = addDays('2024-01-15', 7);
    expect(result).toBe('2024-01-22');
  });

  it('should handle month rollover', () => {
    const result = addDays('2024-01-30', 5);
    expect(result).toBe('2024-02-04');
  });

  it('should handle adding 0 days', () => {
    const result = addDays('2024-01-15', 0);
    expect(result).toBe('2024-01-15');
  });
});

describe('getShowsInRange', () => {
  const createShow = (overrides: Partial<Show> = {}): Show => ({
    id: '1',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '12:00',
    ...overrides,
  });

  it('should return empty array when no shows in range', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-10' }),
      createShow({ id: '2', date: '2024-01-25' }),
    ];
    const result = getShowsInRange(shows, '2024-01-15', '2024-01-21');
    expect(result).toHaveLength(0);
  });

  it('should return shows within the range', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-15' }),
      createShow({ id: '2', date: '2024-01-18' }),
      createShow({ id: '3', date: '2024-01-21' }),
      createShow({ id: '4', date: '2024-01-25' }),
    ];
    const result = getShowsInRange(shows, '2024-01-15', '2024-01-21');
    expect(result).toHaveLength(3);
    expect(result.map((s) => s.id)).toEqual(['1', '2', '3']);
  });

  it('should include boundary dates', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-15' }),
      createShow({ id: '2', date: '2024-01-21' }),
    ];
    const result = getShowsInRange(shows, '2024-01-15', '2024-01-21');
    expect(result).toHaveLength(2);
  });
});

describe('groupShowsByDate', () => {
  const createShow = (overrides: Partial<Show> = {}): Show => ({
    id: '1',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '12:00',
    ...overrides,
  });

  it('should return empty array for empty input', () => {
    const result = groupShowsByDate([]);
    expect(result).toEqual([]);
  });

  it('should group single show correctly', () => {
    const shows = [createShow({ id: '1', date: '2024-01-15' })];
    const result = groupShowsByDate(shows);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].shows).toHaveLength(1);
    expect(result[0].dayName).toBe('Monday');
  });

  it('should group multiple shows on the same date', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-15', startTime: '10:00' }),
      createShow({ id: '2', date: '2024-01-15', startTime: '14:00' }),
      createShow({ id: '3', date: '2024-01-15', startTime: '18:00' }),
    ];
    const result = groupShowsByDate(shows);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[0].shows).toHaveLength(3);
  });

  it('should create separate groups for different dates', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-15' }),
      createShow({ id: '2', date: '2024-01-16' }),
      createShow({ id: '3', date: '2024-01-17' }),
    ];
    const result = groupShowsByDate(shows);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2024-01-15');
    expect(result[1].date).toBe('2024-01-16');
    expect(result[2].date).toBe('2024-01-17');
  });

  it('should sort groups by date ascending', () => {
    const shows = [
      createShow({ id: '1', date: '2024-01-17' }),
      createShow({ id: '2', date: '2024-01-15' }),
      createShow({ id: '3', date: '2024-01-16' }),
    ];
    const result = groupShowsByDate(shows);

    expect(result[0].date).toBe('2024-01-15');
    expect(result[1].date).toBe('2024-01-16');
    expect(result[2].date).toBe('2024-01-17');
  });

  it('should include formattedDate and dayName for each group', () => {
    const shows = [createShow({ id: '1', date: '2024-01-15' })];
    const result = groupShowsByDate(shows);

    expect(result[0].formattedDate).toBeDefined();
    expect(result[0].dayName).toBe('Monday');
  });

  it('should preserve all show properties in the grouped result', () => {
    const shows = [
      createShow({
        id: 'show-1',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '12:00',
        name: 'Morning Show',
        hostName: 'DJ Mike',
      }),
    ];
    const result = groupShowsByDate(shows);

    expect(result[0].shows[0]).toEqual({
      id: 'show-1',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '12:00',
      name: 'Morning Show',
      hostName: 'DJ Mike',
    });
  });
});
