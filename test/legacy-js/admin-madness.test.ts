/**
 * Tests for admin-madness.js (jQuery-free rewrite).
 *
 * Verifies vote submission, scoreboard polling, and DOM wiring using
 * vanilla fetch and DOM APIs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
const { AdminMadness } = require('../../src/js/admin-madness.js');

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions, @typescript-eslint/naming-convention
const { _init } = require('../../src/js/admin-madness.js');

describe('AdminMadness', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<div>updated</div>'),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('vote', () => {
    it('sends a POST request with form data', async () => {
      const form = document.createElement('form');
      form.innerHTML = `
        <input type="hidden" name="match" id="match" value="42" />
        <input type="hidden" name="band" value="1" />
      `;
      document.body.appendChild(form);

      AdminMadness.vote(form);

      expect(fetchMock).toHaveBeenCalledWith(
        window.location.href,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      // Body should contain serialized form data
      const { body } = fetchMock.mock.calls[0][1];
      expect(body).toContain('match=42');
      expect(body).toContain('band=1');
    });

    it('calls updateMatchVotes on success', async () => {
      const form = document.createElement('form');
      form.innerHTML = '<input type="hidden" name="match" id="match" value="7" />';
      document.body.appendChild(form);

      const spy = vi.spyOn(AdminMadness, 'updateMatchVotes');
      AdminMadness.vote(form);

      // Wait for async fetch to resolve
      await vi.waitFor(() => {
        expect(spy).toHaveBeenCalledWith('7');
      });

      spy.mockRestore();
    });
  });

  describe('updateMatchVotes', () => {
    it('updates the scoreboard of the matching table', async () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td><input name="match" value="42" /></td>
            <td class="scoreboard">old content</td>
          </tr>
        </table>
      `;

      AdminMadness.updateMatchVotes('42');

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          'partials/_update_admin_scoreboard.php',
          expect.objectContaining({ method: 'POST' }),
        );
      });

      await vi.waitFor(() => {
        expect(document.querySelector('.scoreboard').innerHTML).toBe('<div>updated</div>');
      });
    });
  });

  describe('updateAdminScoreboard', () => {
    it('does nothing when timer says "Match Over"', () => {
      document.body.innerHTML = '<span id="mrm_timer">Match Over</span>';
      AdminMadness.updateAdminScoreboard();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does nothing when timer says "00:00"', () => {
      document.body.innerHTML = '<span id="mrm_timer">00:00</span>';
      AdminMadness.updateAdminScoreboard();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fetches and updates when timer is active', async () => {
      document.body.innerHTML = `
        <span id="mrm_timer">05:30</span>
        <div id="live_match"><div class="scoreboard">old</div></div>
      `;

      AdminMadness.updateAdminScoreboard();

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('partials/_update_admin_scoreboard.php');
      });

      await vi.waitFor(() => {
        expect(document.querySelector('.scoreboard').innerHTML).toBe('<div>updated</div>');
      });
    });
  });

  describe('values', () => {
    it('serializes form fields into a query string', () => {
      document.body.innerHTML = `
        <form id="testForm">
          <input id="action" value="vote" />
          <input id="match" value="42" />
          <input id="band" value="1" />
          <input id="round" value="2" />
        </form>
      `;

      const result = AdminMadness.values('#testForm');
      expect(result).toBe('action=vote&match=42&band=1&round=2');
    });

    it('returns empty string when form is not found', () => {
      expect(AdminMadness.values('#nonexistent')).toBe('');
    });
  });

  describe('startScoreboardPolling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls updateAdminScoreboard immediately', () => {
      const spy = vi.spyOn(AdminMadness, 'updateAdminScoreboard').mockImplementation(() => {});
      AdminMadness.startScoreboardPolling();
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('calls updateAdminScoreboard again on interval when scoreboard is present', () => {
      document.body.innerHTML = '<div class="scoreboard"></div>';
      const spy = vi.spyOn(AdminMadness, 'updateAdminScoreboard').mockImplementation(() => {});
      AdminMadness.startScoreboardPolling();
      expect(spy).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(5001);
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('skips interval update when no scoreboard in DOM', () => {
      document.body.innerHTML = '';
      const spy = vi.spyOn(AdminMadness, 'updateAdminScoreboard').mockImplementation(() => {});
      AdminMadness.startScoreboardPolling();
      expect(spy).toHaveBeenCalledTimes(1); // immediate call only
      vi.advanceTimersByTime(5001);
      expect(spy).toHaveBeenCalledTimes(1); // no additional call
      spy.mockRestore();
    });
  });

  describe('updateMatchVotes edge cases', () => {
    it('does nothing when match input is not found', async () => {
      document.body.innerHTML = '<table><tr><td class="scoreboard">old</td></tr></table>';
      AdminMadness.updateMatchVotes('99');
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
      // scoreboard unchanged since no matching input
      expect(document.querySelector('.scoreboard')!.innerHTML).toBe('old');
    });

    it('does nothing when match input has no ancestor table', async () => {
      document.body.innerHTML = '<input name="match" value="5" />';
      AdminMadness.updateMatchVotes('5');
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });
      // no table, no scoreboard update
    });

    it('handles non-ok response gracefully', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('') });
      document.body.innerHTML = `
        <table>
          <tr><td><input name="match" value="42" /></td></tr>
          <tr><td class="scoreboard">original</td></tr>
        </table>
      `;
      // Should not throw
      AdminMadness.updateMatchVotes('42');
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
      // scoreboard unchanged because of HTTP error
      expect(document.querySelector('.scoreboard')!.innerHTML).toBe('original');
    });
  });
});

describe('_init', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<div>updated</div>'),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('wires click handlers for band1 vote buttons', () => {
    document.body.innerHTML = `
      <div class="table-center">
        <form>
          <input name="match" value="1" />
          <button class="vote_for_band1">Vote Band 1</button>
        </form>
      </div>
    `;
    const spy = vi.spyOn(AdminMadness, 'vote').mockImplementation(() => {});
    _init();
    const btn = document.querySelector('.vote_for_band1') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('wires click handlers for band2 vote buttons', () => {
    document.body.innerHTML = `
      <div class="table-center">
        <form>
          <input name="match" value="2" />
          <button class="vote_for_band2">Vote Band 2</button>
        </form>
      </div>
    `;
    const spy = vi.spyOn(AdminMadness, 'vote').mockImplementation(() => {});
    _init();
    const btn = document.querySelector('.vote_for_band2') as HTMLButtonElement;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('calls vote with the closest form when band1 button is clicked', () => {
    document.body.innerHTML = `
      <div class="table-center">
        <form id="form1">
          <input name="match" value="10" />
          <button class="vote_for_band1">Vote</button>
        </form>
      </div>
    `;
    const spy = vi.spyOn(AdminMadness, 'vote').mockImplementation(() => {});
    _init();
    const btn = document.querySelector('.vote_for_band1') as HTMLButtonElement;
    btn.click();
    const expectedForm = document.getElementById('form1');
    expect(spy).toHaveBeenCalledWith(expectedForm);
  });

  it('calls startScoreboardPolling', () => {
    const spy = vi.spyOn(AdminMadness, 'startScoreboardPolling').mockImplementation(() => {});
    _init();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('prevents default on band1 button click', () => {
    document.body.innerHTML = `
      <div class="table-center">
        <form>
          <button class="vote_for_band1" type="submit">Vote</button>
        </form>
      </div>
    `;
    vi.spyOn(AdminMadness, 'vote').mockImplementation(() => {});
    _init();
    const btn = document.querySelector('.vote_for_band1') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('prevents default on band2 button click', () => {
    document.body.innerHTML = `
      <div class="table-center">
        <form>
          <button class="vote_for_band2" type="submit">Vote</button>
        </form>
      </div>
    `;
    vi.spyOn(AdminMadness, 'vote').mockImplementation(() => {});
    _init();
    const btn = document.querySelector('.vote_for_band2') as HTMLButtonElement;
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    btn.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
  });
});
