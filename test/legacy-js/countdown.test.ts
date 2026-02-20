/**
 * Tests for legacy countdown.js functions
 *
 * Testing pure logic functions from the legacy Modern Rock Madness JavaScript:
 * - Madness.displayDiffFormat(diff) - Formats time differences for countdown display
 *
 * Note: Other functions (startTimer, updateScoreboard) are DOM-coupled and use
 * timers, so they will be tested with E2E Playwright tests per the testing plan.
 */

import { describe, it, expect } from 'vitest';

// Import the Madness object directly from the legacy JS file
// The file now exports using CommonJS for Node.js compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
const { Madness } = require('../../src/js/countdown.js');

const { displayDiffFormat } = Madness;

describe('Madness.displayDiffFormat', () => {
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HRS = 60 * MIN;

  it('formats time with hours:minutes:seconds when hours > 0', () => {
    // 2 hours, 30 minutes, 45 seconds
    const diff = 2 * HRS + 30 * MIN + 45 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('02:30:45');
  });

  it('formats time with minutes:seconds when hours = 0', () => {
    // 30 minutes, 45 seconds
    const diff = 30 * MIN + 45 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('30:45');
  });

  it('handles 0 hours 0 minutes (seconds only)', () => {
    // 45 seconds
    const diff = 45 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('00:45');
  });

  it('handles 0 seconds remaining', () => {
    const diff = 0;
    const result = displayDiffFormat(diff);
    expect(result).toBe('00:00');
  });

  it('formats 1 hour exactly', () => {
    const diff = 1 * HRS;
    const result = displayDiffFormat(diff);
    expect(result).toBe('01:00:00');
  });

  it('formats 1 minute exactly', () => {
    const diff = 1 * MIN;
    const result = displayDiffFormat(diff);
    expect(result).toBe('01:00');
  });

  it('formats 1 second exactly', () => {
    const diff = 1 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('00:01');
  });

  it('formats 59 minutes 59 seconds (just under 1 hour)', () => {
    const diff = 59 * MIN + 59 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('59:59');
  });

  it('formats 1 hour 0 minutes 0 seconds', () => {
    const diff = 1 * HRS + 0 * MIN + 0 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('01:00:00');
  });

  it('formats 1 hour 1 minute 1 second', () => {
    const diff = 1 * HRS + 1 * MIN + 1 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('01:01:01');
  });

  it('formats 23 hours 59 minutes 59 seconds (almost a day)', () => {
    const diff = 23 * HRS + 59 * MIN + 59 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('23:59:59');
  });

  it('formats 10 hours 5 minutes 3 seconds (tests zero-padding)', () => {
    const diff = 10 * HRS + 5 * MIN + 3 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('10:05:03');
  });

  it('formats fractional seconds (rounds down)', () => {
    // 30.7 seconds should display as 30 seconds
    const diff = 30.7 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('00:30');
  });

  it('handles large time differences (100+ hours)', () => {
    // 100 hours, 30 minutes, 15 seconds
    const diff = 100 * HRS + 30 * MIN + 15 * SEC;
    const result = displayDiffFormat(diff);
    expect(result).toBe('100:30:15');
  });
});
