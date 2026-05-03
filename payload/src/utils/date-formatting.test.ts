import { describe, it, expect } from 'vitest';
import { humanizeDate } from './date-formatting';

describe('humanizeDate', () => {
  it('formats a standard ISO date', () => {
    expect(humanizeDate('2026-04-20')).toBe('April 20th, 2026');
  });

  it('uses "st" suffix for the 1st', () => {
    expect(humanizeDate('2026-01-01')).toBe('January 1st, 2026');
  });

  it('uses "nd" suffix for the 2nd', () => {
    expect(humanizeDate('2026-03-02')).toBe('March 2nd, 2026');
  });

  it('uses "rd" suffix for the 3rd', () => {
    expect(humanizeDate('2026-05-03')).toBe('May 3rd, 2026');
  });

  it('uses "th" for 11th (teen exception)', () => {
    expect(humanizeDate('2026-06-11')).toBe('June 11th, 2026');
  });

  it('uses "th" for 12th (teen exception)', () => {
    expect(humanizeDate('2026-07-12')).toBe('July 12th, 2026');
  });

  it('uses "th" for 13th (teen exception)', () => {
    expect(humanizeDate('2026-08-13')).toBe('August 13th, 2026');
  });

  it('uses "st" for 21st', () => {
    expect(humanizeDate('2026-09-21')).toBe('September 21st, 2026');
  });

  it('uses "nd" for 22nd', () => {
    expect(humanizeDate('2026-10-22')).toBe('October 22nd, 2026');
  });

  it('uses "rd" for 23rd', () => {
    expect(humanizeDate('2026-11-23')).toBe('November 23rd, 2026');
  });

  it('formats end-of-month dates correctly', () => {
    expect(humanizeDate('2026-12-31')).toBe('December 31st, 2026');
  });

  it('handles dates with leading zeros in day/month', () => {
    expect(humanizeDate('2026-02-09')).toBe('February 9th, 2026');
  });

  it('handles a century-change year', () => {
    expect(humanizeDate('2000-01-01')).toBe('January 1st, 2000');
  });

  it('returns the original string for an invalid date', () => {
    expect(humanizeDate('not-a-date')).toBe('not-a-date');
  });

  it('returns the original string for an empty string', () => {
    expect(humanizeDate('')).toBe('');
  });
});
