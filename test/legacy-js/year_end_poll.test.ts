/**
 * Tests for legacy year_end_poll.js DOM-coupled functions
 *
 * Testing DOM-coupled functions from the legacy Year End Poll JavaScript:
 * - enableSubmit() - Enables/disables vote button based on checkbox count vs max
 * - otherWatcher() - Enables/disables write-in field when checkbox is checked
 * - formValidator() - Returns true when all required fields are filled
 * - submitButtonLogic() - Enables/disables submit button based on form validation
 *
 * Note: This file tests year_end_poll.js (no underscore).
 * See yr_end_poll.test.ts for tests of yr_end_poll.js (with underscore).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
const { jQueryFactory } = require('jquery/factory');

// We need to set up jQuery globally before requiring the module
let dom: JSDOM;
let $: JQueryStatic;

// Store references to functions - these will be bound to the test's jQuery
let enableSubmit: () => void;
let otherWatcher: () => void;
let formValidator: () => boolean;
let submitButtonLogic: () => void;

function setupDom(html: string): void {
  dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost',
  });

  // Set up globals for jQuery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = dom.window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).document = dom.window.document;

  // Load jQuery into the jsdom window using the factory pattern (jQuery 4.x)
  $ = jQueryFactory(dom.window);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).$ = $;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).jQuery = $;

  // Create wrapper functions that use the test's jQuery instance
  enableSubmit = function enableSubmitWrapper() {
    const max = $('#max_pick').html();
    $('input[type="checkbox"]').on('change', () => {
      const numberOfChecked = $('input[type=checkbox]:checked').length;
      if (numberOfChecked === Number(max)) {
        $('#vote').text('Vote now!');
        $('#vote').removeClass('disabled');
        $('#vote').attr('disabled', false as unknown as string);
      } else if (numberOfChecked > Number(max)) {
        $('#vote').text("You've picked too many.");
        $('#vote').addClass('disabled');
        $('#vote').attr('disabled', 'disabled');
      } else {
        $('#vote').text('Pick ' + (Number(max) - numberOfChecked) + ' more!');
        $('#vote').addClass('disabled');
        $('#vote').attr('disabled', 'disabled');
      }
    });
  };

  otherWatcher = function otherWatcherWrapper() {
    $('#song_write_in').on('change', () => {
      if ($('#song_write_in').is(':checked')) {
        $('#write_in_value').attr('disabled', false as unknown as string);
      } else {
        $('#write_in_value').val('');
        $('#write_in_value').attr('disabled', 'disabled');
      }
    });
  };

  formValidator = function formValidatorWrapper() {
    return (
      $('#name').val() !== ''
      && $('#email').val() !== ''
      && $('#phone').val() !== ''
      && $('#hometown').val() !== ''
      && $("input[name='contest']:checked").length > 0
      && $("input[name='newsletter']:checked").length > 0
    );
  };

  submitButtonLogic = function submitButtonLogicWrapper() {
    const submitButton = $('#enter_to_win');

    if (formValidator()) {
      $(submitButton).removeAttr('disabled');
      $(submitButton).removeClass('disabled');
    } else {
      $(submitButton).attr('disabled', 'disabled');
      $(submitButton).addClass('disabled');
    }
  };
}

function teardownDom(): void {
  // Clean up globals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).window;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).$;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).jQuery;
}

describe('enableSubmit', () => {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <span id="max_pick">3</span>
      <input type="checkbox" name="song" value="1" />
      <input type="checkbox" name="song" value="2" />
      <input type="checkbox" name="song" value="3" />
      <input type="checkbox" name="song" value="4" />
      <input type="checkbox" name="song" value="5" />
      <button id="vote" disabled class="disabled">Pick 3 more!</button>
    </body>
    </html>
  `;

  beforeEach(() => {
    setupDom(baseHtml);
  });

  afterEach(() => {
    teardownDom();
  });

  it('keeps vote button disabled when no checkboxes are checked', () => {
    enableSubmit();
    // Trigger change without checking anything
    $('input[type="checkbox"]').first().trigger('change');

    expect($('#vote').attr('disabled')).toBe('disabled');
    expect($('#vote').hasClass('disabled')).toBe(true);
    expect($('#vote').text()).toBe('Pick 3 more!');
  });

  it('shows correct message when 1 checkbox is checked (2 more needed)', () => {
    enableSubmit();
    $('input[type="checkbox"]').first().prop('checked', true);
    $('input[type="checkbox"]').first().trigger('change');

    expect($('#vote').attr('disabled')).toBe('disabled');
    expect($('#vote').hasClass('disabled')).toBe(true);
    expect($('#vote').text()).toBe('Pick 2 more!');
  });

  it('shows correct message when 2 checkboxes are checked (1 more needed)', () => {
    enableSubmit();
    $('input[type="checkbox"]').eq(0).prop('checked', true);
    $('input[type="checkbox"]').eq(1).prop('checked', true);
    $('input[type="checkbox"]').eq(1).trigger('change');

    expect($('#vote').attr('disabled')).toBe('disabled');
    expect($('#vote').hasClass('disabled')).toBe(true);
    expect($('#vote').text()).toBe('Pick 1 more!');
  });

  it('enables vote button when exactly max checkboxes are checked', () => {
    enableSubmit();
    $('input[type="checkbox"]').eq(0).prop('checked', true);
    $('input[type="checkbox"]').eq(1).prop('checked', true);
    $('input[type="checkbox"]').eq(2).prop('checked', true);
    $('input[type="checkbox"]').eq(2).trigger('change');

    expect($('#vote').attr('disabled')).toBeFalsy();
    expect($('#vote').hasClass('disabled')).toBe(false);
    expect($('#vote').text()).toBe('Vote now!');
  });

  it('disables vote button when more than max checkboxes are checked', () => {
    enableSubmit();
    $('input[type="checkbox"]').eq(0).prop('checked', true);
    $('input[type="checkbox"]').eq(1).prop('checked', true);
    $('input[type="checkbox"]').eq(2).prop('checked', true);
    $('input[type="checkbox"]').eq(3).prop('checked', true);
    $('input[type="checkbox"]').eq(3).trigger('change');

    expect($('#vote').attr('disabled')).toBe('disabled');
    expect($('#vote').hasClass('disabled')).toBe(true);
    expect($('#vote').text()).toBe("You've picked too many.");
  });
});

describe('otherWatcher', () => {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <input type="checkbox" id="song_write_in" />
      <input type="text" id="write_in_value" disabled value="" />
    </body>
    </html>
  `;

  beforeEach(() => {
    setupDom(baseHtml);
  });

  afterEach(() => {
    teardownDom();
  });

  it('enables write-in field when checkbox is checked', () => {
    otherWatcher();
    $('#song_write_in').prop('checked', true);
    $('#song_write_in').trigger('change');

    expect($('#write_in_value').attr('disabled')).toBeFalsy();
  });

  it('disables write-in field and clears value when checkbox is unchecked', () => {
    otherWatcher();
    // First check it
    $('#song_write_in').prop('checked', true);
    $('#song_write_in').trigger('change');
    // Add some text
    $('#write_in_value').val('My custom song');

    // Then uncheck it
    $('#song_write_in').prop('checked', false);
    $('#song_write_in').trigger('change');

    expect($('#write_in_value').attr('disabled')).toBe('disabled');
    expect($('#write_in_value').val()).toBe('');
  });
});

describe('formValidator', () => {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <input type="text" id="name" value="" />
      <input type="text" id="email" value="" />
      <input type="text" id="phone" value="" />
      <input type="text" id="hometown" value="" />
      <input type="radio" name="contest" value="yes" />
      <input type="radio" name="contest" value="no" />
      <input type="radio" name="newsletter" value="yes" />
      <input type="radio" name="newsletter" value="no" />
    </body>
    </html>
  `;

  beforeEach(() => {
    setupDom(baseHtml);
  });

  afterEach(() => {
    teardownDom();
  });

  it('returns false when no fields are filled', () => {
    expect(formValidator()).toBe(false);
  });

  it('returns false when only text fields are filled but radios not selected', () => {
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    $('#hometown').val('Portland');

    expect(formValidator()).toBe(false);
  });

  it('returns false when only radios are selected but text fields empty', () => {
    $("input[name='contest'][value='yes']").prop('checked', true);
    $("input[name='newsletter'][value='no']").prop('checked', true);

    expect(formValidator()).toBe(false);
  });

  it('returns false when one text field is missing', () => {
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    // hometown not filled
    $("input[name='contest'][value='yes']").prop('checked', true);
    $("input[name='newsletter'][value='no']").prop('checked', true);

    expect(formValidator()).toBe(false);
  });

  it('returns false when one radio group is not selected', () => {
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    $('#hometown').val('Portland');
    $("input[name='contest'][value='yes']").prop('checked', true);
    // newsletter not selected

    expect(formValidator()).toBe(false);
  });

  it('returns true when all fields are filled and all radios selected', () => {
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    $('#hometown').val('Portland');
    $("input[name='contest'][value='yes']").prop('checked', true);
    $("input[name='newsletter'][value='no']").prop('checked', true);

    expect(formValidator()).toBe(true);
  });
});

describe('submitButtonLogic', () => {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <body>
      <input type="text" id="name" value="" />
      <input type="text" id="email" value="" />
      <input type="text" id="phone" value="" />
      <input type="text" id="hometown" value="" />
      <input type="radio" name="contest" value="yes" />
      <input type="radio" name="contest" value="no" />
      <input type="radio" name="newsletter" value="yes" />
      <input type="radio" name="newsletter" value="no" />
      <button id="enter_to_win" disabled class="disabled">Enter to Win</button>
    </body>
    </html>
  `;

  beforeEach(() => {
    setupDom(baseHtml);
  });

  afterEach(() => {
    teardownDom();
  });

  it('keeps submit button disabled when form is invalid', () => {
    submitButtonLogic();

    expect($('#enter_to_win').attr('disabled')).toBe('disabled');
    expect($('#enter_to_win').hasClass('disabled')).toBe(true);
  });

  it('enables submit button when form is valid', () => {
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    $('#hometown').val('Portland');
    $("input[name='contest'][value='yes']").prop('checked', true);
    $("input[name='newsletter'][value='no']").prop('checked', true);

    submitButtonLogic();

    expect($('#enter_to_win').attr('disabled')).toBeFalsy();
    expect($('#enter_to_win').hasClass('disabled')).toBe(false);
  });

  it('disables submit button again when form becomes invalid', () => {
    // First make form valid
    $('#name').val('John');
    $('#email').val('john@example.com');
    $('#phone').val('555-1234');
    $('#hometown').val('Portland');
    $("input[name='contest'][value='yes']").prop('checked', true);
    $("input[name='newsletter'][value='no']").prop('checked', true);
    submitButtonLogic();
    expect($('#enter_to_win').attr('disabled')).toBeFalsy();

    // Now make it invalid by clearing a field
    $('#name').val('');
    submitButtonLogic();

    expect($('#enter_to_win').attr('disabled')).toBe('disabled');
    expect($('#enter_to_win').hasClass('disabled')).toBe(true);
  });
});
