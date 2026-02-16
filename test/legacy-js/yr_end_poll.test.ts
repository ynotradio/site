/**
 * Tests for legacy yr_end_poll.js functions
 *
 * Testing pure logic functions from the legacy Year End Poll JavaScript:
 * - errorMessage(numberOfChecked, max) - Validates boundary conditions
 *
 * Note: Other functions (enableSubmit, otherWatcher) are DOM-coupled and
 * will be tested with E2E Playwright tests per the testing plan.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Load the legacy JS file
const jsFilePath = path.join(__dirname, '../../src/js/yr_end_poll.js');
const jsCode = fs.readFileSync(jsFilePath, 'utf-8');

// Extract the errorMessage function using eval
// This is necessary because the legacy code is not modularized
let errorMessage: (numberOfChecked: number, max: number) => string | undefined;

beforeAll(() => {
  // Execute the JS code to get the errorMessage function
  // We need to create a minimal environment for the function
  const functionWrapper = `
    ${jsCode}
    errorMessage;
  `;
  // eslint-disable-next-line no-eval
  errorMessage = eval(functionWrapper);
});

describe('errorMessage', () => {
  it('returns message when no options selected (0 checked)', () => {
    const result = errorMessage(0, 5);
    expect(result).toBe('You need to select at least one option above.');
  });

  it('returns undefined when exactly 1 option selected and max is 5', () => {
    const result = errorMessage(1, 5);
    expect(result).toBeUndefined();
  });

  it('returns undefined when exactly max options selected', () => {
    const result = errorMessage(5, 5);
    expect(result).toBeUndefined();
  });

  it('returns message when more than max options selected (6 > 5)', () => {
    const result = errorMessage(6, 5);
    expect(result).toBe('You have selected too many.');
  });

  it('returns undefined when checked is between 1 and max', () => {
    const result = errorMessage(3, 5);
    expect(result).toBeUndefined();
  });

  it('returns message when selected is 1 more than max', () => {
    const result = errorMessage(6, 5);
    expect(result).toBe('You have selected too many.');
  });

  it('returns message when selected is significantly more than max', () => {
    const result = errorMessage(20, 5);
    expect(result).toBe('You have selected too many.');
  });

  it('handles max = 1 case (single selection poll)', () => {
    expect(errorMessage(0, 1)).toBe('You need to select at least one option above.');
    expect(errorMessage(1, 1)).toBeUndefined();
    expect(errorMessage(2, 1)).toBe('You have selected too many.');
  });

  it('handles max = 10 case (large selection poll)', () => {
    expect(errorMessage(0, 10)).toBe('You need to select at least one option above.');
    expect(errorMessage(5, 10)).toBeUndefined();
    expect(errorMessage(10, 10)).toBeUndefined();
    expect(errorMessage(11, 10)).toBe('You have selected too many.');
  });

  it('handles edge case: 0 checked, max = 0', () => {
    // Though unusual, if max is 0 and nothing is checked, we still show the error
    const result = errorMessage(0, 0);
    expect(result).toBe('You need to select at least one option above.');
  });

  it('handles edge case: 1 checked, max = 0', () => {
    // If max is 0 but user managed to check 1, that's too many
    const result = errorMessage(1, 0);
    expect(result).toBe('You have selected too many.');
  });
});
