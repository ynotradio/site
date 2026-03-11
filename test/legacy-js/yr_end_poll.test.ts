/**
 * Tests for legacy yr_end_poll.js functions
 *
 * Testing all exported functions:
 * - errorMessage(numberOfChecked, max) - Validates boundary conditions
 * - enableSubmit() - Enables/disables submit button based on checkbox count
 * - otherWatcher() - Enables/disables write-in field when checkbox toggled
 * - init() - Calls enableSubmit and otherWatcher
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Minimal jQuery-like mock that wraps real DOM operations.
 * yr_end_poll.js uses: $(selector).change(fn), $(selector).html(),
 * $(selector).attr(), $(selector).hide/show(), $(selector).is(), $(selector).val()
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createJQueryMock(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function jq(selector: string): any {
    const els = Array.from(document.querySelectorAll(selector));
    const first = els[0] as HTMLElement | undefined;

    return {
      html(value?: string) {
        if (value === undefined) return first ? first.innerHTML : '';
        els.forEach((el) => { Object.assign(el, { innerHTML: value }); });
        return this;
      },
      change(fn: (this: HTMLElement) => void) {
        els.forEach((el) => el.addEventListener('change', fn.bind(el) as EventListener));
        return this;
      },
      attr(name: string, value?: string | boolean) {
        if (value === undefined) return first?.getAttribute(name);
        if (value === false) {
          els.forEach((el) => {
            el.removeAttribute(name);
            // eslint-disable-next-line no-param-reassign
            if (name === 'disabled') { (el as HTMLButtonElement).disabled = false; }
          });
        } else {
          els.forEach((el) => {
            el.setAttribute(name, String(value));
            // eslint-disable-next-line no-param-reassign
            if (name === 'disabled') { (el as HTMLButtonElement).disabled = true; }
          });
        }
        return this;
      },
      hide() {
        els.forEach((el) => { Object.assign((el as HTMLElement).style, { display: 'none' }); });
        return this;
      },
      show() {
        els.forEach((el) => { Object.assign((el as HTMLElement).style, { display: '' }); });
        return this;
      },
      is(sel: string) {
        if (sel === ':checked') return (first as HTMLInputElement)?.checked ?? false;
        return false;
      },
      val(v?: string) {
        if (v === undefined) return (first as HTMLInputElement)?.value ?? '';
        // eslint-disable-next-line no-param-reassign
        els.forEach((el) => { (el as HTMLInputElement).value = v; });
        return this;
      },
      length: els.length,
    };
  }
  return jq;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, global-require
const poll = require('../../src/js/yr_end_poll.js');

describe('errorMessage', () => {
  it('returns message when no options selected (0 checked)', () => {
    expect(poll.errorMessage(0, 5)).toBe('You need to select at least one option above.');
  });

  it('returns undefined when exactly 1 option selected and max is 5', () => {
    expect(poll.errorMessage(1, 5)).toBeUndefined();
  });

  it('returns undefined when exactly max options selected', () => {
    expect(poll.errorMessage(5, 5)).toBeUndefined();
  });

  it('returns message when more than max options selected (6 > 5)', () => {
    expect(poll.errorMessage(6, 5)).toBe('You have selected too many.');
  });

  it('returns undefined when checked is between 1 and max', () => {
    expect(poll.errorMessage(3, 5)).toBeUndefined();
  });

  it('handles max = 1 case (single selection poll)', () => {
    expect(poll.errorMessage(0, 1)).toBe('You need to select at least one option above.');
    expect(poll.errorMessage(1, 1)).toBeUndefined();
    expect(poll.errorMessage(2, 1)).toBe('You have selected too many.');
  });
});

describe('enableSubmit (DOM-coupled)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="max_pick">2</span>
      <input type="checkbox" name="song" value="1" />
      <input type="checkbox" name="song" value="2" />
      <input type="checkbox" name="song" value="3" />
      <button id="submit_votes" disabled>Submit</button>
      <span id="error_message" style="display:none"></span>
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).$ = createJQueryMock();
  });

  it('enables submit when checkboxes within range', () => {
    poll.enableSubmit();
    const cb1 = document.querySelectorAll('input[type="checkbox"]')[0] as HTMLInputElement;
    cb1.checked = true;
    cb1.dispatchEvent(new Event('change', { bubbles: true }));

    const btn = document.getElementById('submit_votes') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('disables submit and shows error when too many checked', () => {
    poll.enableSubmit();
    const cbs = document.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    cbs[0].checked = true;
    cbs[1].checked = true;
    cbs[2].checked = true;
    cbs[2].dispatchEvent(new Event('change', { bubbles: true }));

    const btn = document.getElementById('submit_votes') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    const errEl = document.getElementById('error_message') as HTMLElement;
    expect(errEl.style.display).not.toBe('none');
  });
});

describe('otherWatcher (DOM-coupled)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input type="checkbox" id="write_in" />
      <input type="text" id="write_in_value" disabled value="" />
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).$ = createJQueryMock();
  });

  it('enables write-in field when checkbox is checked', () => {
    poll.otherWatcher();
    const cb = document.getElementById('write_in') as HTMLInputElement;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));

    const input = document.getElementById('write_in_value') as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it('disables write-in field and clears value when unchecked', () => {
    poll.otherWatcher();
    const cb = document.getElementById('write_in') as HTMLInputElement;
    const input = document.getElementById('write_in_value') as HTMLInputElement;

    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    input.value = 'My custom song';

    cb.checked = false;
    cb.dispatchEvent(new Event('change', { bubbles: true }));

    expect(input.disabled).toBe(true);
    expect(input.value).toBe('');
  });
});

describe('init', () => {
  it('calls enableSubmit and otherWatcher without errors', () => {
    document.body.innerHTML = `
      <span id="max_pick">2</span>
      <input type="checkbox" name="song" value="1" />
      <button id="submit_votes" disabled>Submit</button>
      <span id="error_message" style="display:none"></span>
      <input type="checkbox" id="write_in" />
      <input type="text" id="write_in_value" disabled />
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).$ = createJQueryMock();
    expect(() => poll.init()).not.toThrow();
  });
});
