/**
 * Tests for legacy countdown.js functions
 *
 * Testing pure logic functions from the legacy Modern Rock Madness JavaScript:
 * - Madness.displayDiffFormat(diff) - Formats time differences for countdown display
 * - Madness._parseAndUpdateScoreboard - Parses server HTML and updates component
 * - Madness.startTimer - Countdown timer with DOM updates
 * - Madness.updateScoreboard - Scoreboard polling
 * - Madness.delayedRedirect - Page redirect after match ends
 * - Madness.loadPartial - jQuery-based partial loading
 */

import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

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

describe('Madness._parseAndUpdateScoreboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('parses <mrm-scoreboard> response and updates attributes', () => {
    const mockEl = document.createElement('div');
    mockEl.setAttribute = function setAttr(name, value) {
      HTMLElement.prototype.setAttribute.call(this, name, value);
    };

    const html = '<mrm-scoreboard band1-pct="62" band2-pct="38" band1-label="62%" band2-label="38%"></mrm-scoreboard>';
    // eslint-disable-next-line no-underscore-dangle
    Madness._parseAndUpdateScoreboard(mockEl, html);

    expect(mockEl.getAttribute('band1-pct')).toBe('62');
    expect(mockEl.getAttribute('band2-pct')).toBe('38');
    expect(mockEl.getAttribute('band1-label')).toBe('62%');
    expect(mockEl.getAttribute('band2-label')).toBe('38%');
  });

  it('falls back to old table format with #band1_score etc.', () => {
    const mockEl = document.createElement('div');

    const html = `
      <table>
        <tr>
          <td id="band1_score">55%</td>
          <td id="band1_value" width="55"></td>
          <td id="band2_value" width="45"></td>
          <td id="band2_score">45%</td>
        </tr>
      </table>
    `;
    // eslint-disable-next-line no-underscore-dangle
    Madness._parseAndUpdateScoreboard(mockEl, html);

    expect(mockEl.getAttribute('band1-label')).toBe('55%');
    expect(mockEl.getAttribute('band2-label')).toBe('45%');
    expect(mockEl.getAttribute('band1-pct')).toBe('55');
    expect(mockEl.getAttribute('band2-pct')).toBe('45');
  });

  it('defaults to "0" when mrm-scoreboard attributes are absent', () => {
    const mockEl = document.createElement('div');
    const html = '<mrm-scoreboard></mrm-scoreboard>';
    // eslint-disable-next-line no-underscore-dangle
    Madness._parseAndUpdateScoreboard(mockEl, html);
    expect(mockEl.getAttribute('band1-pct')).toBe('0');
    expect(mockEl.getAttribute('band2-pct')).toBe('0');
    expect(mockEl.getAttribute('band1-label')).toBe('');
    expect(mockEl.getAttribute('band2-label')).toBe('');
  });

  it('handles empty HTML with no matching elements gracefully', () => {
    const mockEl = document.createElement('div');
    // eslint-disable-next-line no-underscore-dangle
    Madness._parseAndUpdateScoreboard(mockEl, '<div>no relevant elements</div>');
    // No attributes should be set; original state preserved
    expect(mockEl.getAttribute('band1-label')).toBeNull();
    expect(mockEl.getAttribute('band2-label')).toBeNull();
  });

  it('handles partial old table format (only some elements present)', () => {
    const mockEl = document.createElement('div');
    const html = '<table><tr><td id="band1_score">70%</td></tr></table>';
    // eslint-disable-next-line no-underscore-dangle
    Madness._parseAndUpdateScoreboard(mockEl, html);
    expect(mockEl.getAttribute('band1-label')).toBe('70%');
    expect(mockEl.getAttribute('band2-label')).toBeNull();
  });
});

describe('Madness.startTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    Madness.endtime = null;
    Madness.timer = false;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does nothing when no target elements exist', () => {
    Madness.endtime = new Date(Date.now() + 60000);
    Madness.startTimer(Madness.endtime, true);
    // No error thrown; timer not set in Madness.timer since no hasTarget
    expect(Madness.timer).toBe(false);
  });

  it('updates mrm_timer textContent when timer is running', () => {
    document.body.innerHTML = '<span id="mrm_timer"></span>';
    Madness.endtime = new Date(Date.now() + 75000); // 1m15s
    Madness.startTimer(Madness.endtime, true);
    const text = document.getElementById('mrm_timer')!.textContent;
    expect(text).toMatch(/^\d{2}:\d{2}$/);
  });

  it('updates mrm-match-card timer-text when present', () => {
    const matchCard = document.createElement('div');
    matchCard.setAttribute('status', 'running');
    // Simulate custom element selector by setting tagName via id trick
    document.body.innerHTML = '';
    // Use a real DOM element matching the selector
    // jsdom supports custom elements via querySelector
    document.body.innerHTML = '<mrm-match-card status="running"></mrm-match-card>';
    const card = document.querySelector('mrm-match-card[status="running"]') as Element;
    Madness.endtime = new Date(Date.now() + 75000);
    Madness.startTimer(Madness.endtime, true);
    expect(card.getAttribute('timer-text')).toMatch(/^\d{2}:\d{2}$/);
  });

  it('updates both matchCard and timerEl when both are present', () => {
    document.body.innerHTML = '<mrm-match-card status="running"></mrm-match-card><span id="mrm_timer"></span>';
    const card = document.querySelector('mrm-match-card[status="running"]') as Element;
    const timerEl = document.getElementById('mrm_timer')!;
    Madness.endtime = new Date(Date.now() + 75000);
    Madness.startTimer(Madness.endtime, true);
    expect(card.getAttribute('timer-text')).toMatch(/\d{2}:\d{2}/);
    expect(timerEl.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('shows "Match Over" on timerEl when time has expired', () => {
    document.body.innerHTML = '<span id="mrm_timer">01:00</span>';
    Madness.endtime = new Date(Date.now() - 5000); // expired
    Madness.startTimer(Madness.endtime, false);
    expect(document.getElementById('mrm_timer')!.textContent).toBe('Match Over');
  });

  it('shows "Match Over" on matchCard when time has expired', () => {
    document.body.innerHTML = '<mrm-match-card status="running"></mrm-match-card>';
    const card = document.querySelector('mrm-match-card[status="running"]') as Element;
    Madness.endtime = new Date(Date.now() - 5000);
    Madness.startTimer(Madness.endtime, false);
    expect(card.getAttribute('timer-text')).toBe('Match Over');
  });

  it('schedules delayedRedirect 4 seconds after timer expires', () => {
    document.body.innerHTML = '<span id="mrm_timer"></span>';
    const redirectSpy = vi.spyOn(Madness, 'delayedRedirect').mockImplementation(() => {});
    Madness.endtime = new Date(Date.now() - 5000);
    Madness.startTimer(Madness.endtime, false);
    expect(redirectSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4001);
    expect(redirectSpy).toHaveBeenCalledOnce();
  });

  it('schedules next startTimer call after 1 second when running', () => {
    document.body.innerHTML = '<span id="mrm_timer"></span>';
    const spy = vi.spyOn(Madness, 'startTimer');
    Madness.endtime = new Date(Date.now() + 75000);
    Madness.startTimer(Madness.endtime, true);
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1001);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('Madness.delayedRedirect', () => {
  it('does not throw when called', () => {
    // jsdom restricts window.location assignment but the function should not crash
    expect(() => Madness.delayedRedirect()).not.toThrow();
  });
});

describe('Madness.updateScoreboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    Madness.timer = false;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<mrm-scoreboard band1-pct="60" band2-pct="40"></mrm-scoreboard>'),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches scoreboard when element is MRM-SCOREBOARD', async () => {
    document.body.innerHTML = '<mrm-scoreboard id="mrm_scoring"></mrm-scoreboard>';
    Madness.updateScoreboard();
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('partials/_update_scoreboard.php');
    });
  });

  it('updates scoreboard attributes after fetch', async () => {
    document.body.innerHTML = '<mrm-scoreboard id="mrm_scoring"></mrm-scoreboard>';
    const scoreboard = document.getElementById('mrm_scoring')!;
    Madness.updateScoreboard();
    await vi.waitFor(() => {
      expect(scoreboard.getAttribute('band1-pct')).toBe('60');
    });
  });

  it('calls loadPartial when no MRM-SCOREBOARD and $ is defined', () => {
    document.body.innerHTML = '<div id="mrm_scoring"></div>';
    const loadMock = vi.fn();
    const jQueryMock = vi.fn().mockReturnValue({ load: loadMock });
    vi.stubGlobal('$', jQueryMock);
    const loadPartialSpy = vi.spyOn(Madness, 'loadPartial');
    Madness.updateScoreboard();
    expect(loadPartialSpy).toHaveBeenCalledWith('#mrm_scoring', 'partials/_update_scoreboard.php');
  });

  it('does not fetch when no scoreboard element and $ is undefined', () => {
    // No scoreboard in DOM, no $ defined
    Madness.updateScoreboard();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('schedules recursive call when Madness.timer is true', () => {
    Madness.timer = true;
    const spy = vi.spyOn(Madness, 'updateScoreboard');
    Madness.updateScoreboard();
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5001);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not schedule recursive call when Madness.timer is false', () => {
    Madness.timer = false;
    const spy = vi.spyOn(Madness, 'updateScoreboard');
    Madness.updateScoreboard();
    vi.advanceTimersByTime(5001);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('handles fetch errors silently', async () => {
    document.body.innerHTML = '<mrm-scoreboard id="mrm_scoring"></mrm-scoreboard>';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network fail')));
    // Should not throw
    await expect(async () => {
      Madness.updateScoreboard();
      await vi.waitFor(() => {}, { timeout: 100 });
    }).not.toThrow();
  });
});

describe('Madness.loadPartial', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls $(selector).load(partial) when $ is defined', () => {
    const loadMock = vi.fn();
    const jQueryMock = vi.fn().mockReturnValue({ load: loadMock });
    vi.stubGlobal('$', jQueryMock);
    Madness.loadPartial('#mrm_scoring', 'partials/_update_scoreboard.php');
    expect(jQueryMock).toHaveBeenCalledWith('#mrm_scoring');
    expect(loadMock).toHaveBeenCalledWith('partials/_update_scoreboard.php');
  });

  it('does nothing when $ is not defined', () => {
    // Ensure $ is not defined
    vi.stubGlobal('$', undefined);
    expect(() => Madness.loadPartial('#mrm_scoring', 'partials/_update_scoreboard.php')).not.toThrow();
  });
});
