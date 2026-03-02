/**
 * Tests for legacy common_functions.js
 *
 * Testing DOM-manipulation functions used on the ymail.php page:
 * - setDays() - Populates day dropdown based on selected month and year
 * - checkForm() - Concatenates date fields into the birthday hidden field
 *
 * Note: The jQuery-dependent #top11_write_in click handler is not tested here
 * because it requires jQuery's .live() API. It will be covered by E2E Playwright
 * tests per the testing plan.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
const { setDays, checkForm } = require('../../src/js/common_functions.js');

function buildYmailDom(month: string, year: string, day = '1'): void {
  document.body.innerHTML = `
    <select id="send_date_month"><option value="${month}" selected>${month}</option></select>
    <select id="send_date_year"><option value="${year}" selected>${year}</option></select>
    <select id="send_date_day"><option value="${day}" selected>${day}</option></select>
    <input type="hidden" id="birthday" value="" />
  `;
}

describe('setDays', () => {
  it('returns early without error when DOM elements are missing', () => {
    document.body.innerHTML = '';
    expect(() => setDays()).not.toThrow();
  });

  it('populates 31 days for January', () => {
    buildYmailDom('1', '2024');
    setDays();
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    expect(lst.options.length).toBe(31);
    expect(lst.options[0].value).toBe('1');
    expect(lst.options[30].value).toBe('31');
  });

  it('populates 28 days for February in a non-leap year', () => {
    buildYmailDom('2', '2023');
    setDays();
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    expect(lst.options.length).toBe(28);
    expect(lst.options[27].value).toBe('28');
  });

  it('populates 29 days for February in a leap year', () => {
    buildYmailDom('2', '2024');
    setDays();
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    expect(lst.options.length).toBe(29);
    expect(lst.options[28].value).toBe('29');
  });

  it('populates 30 days for April', () => {
    buildYmailDom('4', '2024');
    setDays();
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    expect(lst.options.length).toBe(30);
    expect(lst.options[29].value).toBe('30');
  });

  it('populates 31 days for December', () => {
    buildYmailDom('12', '2024');
    setDays();
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    expect(lst.options.length).toBe(31);
    expect(lst.options[30].value).toBe('31');
  });

  it('replaces existing options (clears the list first)', () => {
    buildYmailDom('1', '2024');
    // Pre-populate with wrong number of options to verify they get cleared
    const lst = document.getElementById('send_date_day') as HTMLSelectElement;
    for (let i = 0; i < 5; i += 1) {
      lst.options[lst.options.length] = new Option(String(i), String(i));
    }
    setDays();
    expect(lst.options.length).toBe(31);
  });
});

describe('checkForm', () => {
  beforeEach(() => {
    buildYmailDom('6', '2024', '15');
  });

  it('returns true', () => {
    const result = checkForm();
    expect(result).toBe(true);
  });

  it('sets birthday value as YYYY-MM-DD', () => {
    checkForm();
    const birthday = document.getElementById('birthday') as HTMLInputElement;
    expect(birthday.value).toBe('2024-6-15');
  });

  it('concatenates year, month, and day with dashes', () => {
    buildYmailDom('12', '2023', '31');
    checkForm();
    const birthday = document.getElementById('birthday') as HTMLInputElement;
    expect(birthday.value).toBe('2023-12-31');
  });
});
