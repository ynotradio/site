/**
 * Tests for legacy common_functions.js functions
 *
 * Testing functions from the legacy Y-Not Radio JavaScript:
 * - setDays() - Populates day dropdown based on month/year selection
 * - checkForm() - Concatenates date fields into a single value
 *
 * Note: The top11_write_in jQuery click handler is DOM-coupled with jQuery's
 * legacy .live() method and will be tested with E2E Playwright tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Store original globals to restore later
const originalDocument = global.document;
const originalOption = (global as unknown as { Option: unknown }).Option;

describe('setDays', () => {
  let dom: JSDOM;
  let setDays: () => void;

  beforeEach(() => {
    // Create a minimal DOM with the required elements
    // Note: select elements need option children for .value to work
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <select id="send_date_month">
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="4">April</option>
          </select>
          <select id="send_date_year">
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>
          <select id="send_date_day"></select>
        </body>
      </html>
    `);
    // Replace global document and Option for the legacy function
    global.document = dom.window.document;
    (global as unknown as { Option: typeof Option }).Option = dom.window.Option as typeof Option;

    // Clear module cache and re-require to pick up new globals
    delete require.cache[require.resolve('../../src/js/common_functions.js')];
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, global-require
    ({ setDays } = require('../../src/js/common_functions.js'));
  });

  afterEach(() => {
    global.document = originalDocument;
    (global as unknown as { Option: unknown }).Option = originalOption;
  });

  it('populates 31 days for January', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '1';
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';

    setDays();

    const daySelect = doc.getElementById('send_date_day') as HTMLSelectElement;
    expect(daySelect.options.length).toBe(31);
    expect(daySelect.options[0].value).toBe('1');
    expect(daySelect.options[30].value).toBe('31');
  });

  it('populates 28 days for February in non-leap year', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '2';
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2023';

    setDays();

    const daySelect = doc.getElementById('send_date_day') as HTMLSelectElement;
    expect(daySelect.options.length).toBe(28);
  });

  it('populates 29 days for February in leap year', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '2';
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';

    setDays();

    const daySelect = doc.getElementById('send_date_day') as HTMLSelectElement;
    expect(daySelect.options.length).toBe(29);
  });

  it('populates 30 days for April', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '4';
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';

    setDays();

    const daySelect = doc.getElementById('send_date_day') as HTMLSelectElement;
    expect(daySelect.options.length).toBe(30);
  });

  it('clears existing options before populating', () => {
    const doc = dom.window.document;
    const daySelect = doc.getElementById('send_date_day') as HTMLSelectElement;
    // Pre-populate with dummy options
    daySelect.options.add(new dom.window.Option('test', 'test'));
    daySelect.options.add(new dom.window.Option('test2', 'test2'));
    expect(daySelect.options.length).toBe(2);

    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '1';
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';

    setDays();

    expect(daySelect.options.length).toBe(31);
    expect(daySelect.options[0].value).toBe('1');
  });

  it('returns early if send_date_month does not exist', () => {
    // Create DOM without the month element
    const newDom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <select id="send_date_year"></select>
          <select id="send_date_day"></select>
        </body>
      </html>
    `);
    global.document = newDom.window.document;
    (global as unknown as { Option: typeof Option }).Option = newDom.window.Option as typeof Option;

    // Clear cache and re-import
    delete require.cache[require.resolve('../../src/js/common_functions.js')];
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, global-require
    const freshModule = require('../../src/js/common_functions.js');

    // Should not throw an error
    expect(() => freshModule.setDays()).not.toThrow();
  });
});

describe('checkForm', () => {
  let dom: JSDOM;
  let checkForm: () => boolean;

  beforeEach(() => {
    // Create a minimal DOM with the required elements, including option elements
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="hidden" id="birthday" value="" />
          <select id="send_date_month">
            <option value="1">January</option>
            <option value="3">March</option>
            <option value="6">June</option>
            <option value="12">December</option>
          </select>
          <select id="send_date_year">
            <option value="2024">2024</option>
          </select>
          <select id="send_date_day">
            <option value="5">5</option>
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="30">30</option>
          </select>
        </body>
      </html>
    `);
    // Replace global document for the legacy function
    global.document = dom.window.document;

    // Clear module cache and re-require to pick up new globals
    delete require.cache[require.resolve('../../src/js/common_functions.js')];
    // eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, global-require
    ({ checkForm } = require('../../src/js/common_functions.js'));
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it('concatenates date fields into birthday input', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '3';
    (doc.getElementById('send_date_day') as HTMLSelectElement).value = '15';

    const result = checkForm();

    expect(result).toBe(true);
    expect((doc.getElementById('birthday') as HTMLInputElement).value).toBe('2024-3-15');
  });

  it('handles single-digit month and day', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '1';
    (doc.getElementById('send_date_day') as HTMLSelectElement).value = '5';

    checkForm();

    expect((doc.getElementById('birthday') as HTMLInputElement).value).toBe('2024-1-5');
  });

  it('handles double-digit month and day', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '12';
    (doc.getElementById('send_date_day') as HTMLSelectElement).value = '25';

    checkForm();

    expect((doc.getElementById('birthday') as HTMLInputElement).value).toBe('2024-12-25');
  });

  it('always returns true', () => {
    const doc = dom.window.document;
    (doc.getElementById('send_date_year') as HTMLSelectElement).value = '2024';
    (doc.getElementById('send_date_month') as HTMLSelectElement).value = '6';
    (doc.getElementById('send_date_day') as HTMLSelectElement).value = '30';

    const result = checkForm();

    expect(result).toBe(true);
  });
});
