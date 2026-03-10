/**
 * Tests for admin-madness.js (jQuery-free rewrite).
 *
 * Verifies vote submission, scoreboard polling, and DOM wiring using
 * vanilla fetch and DOM APIs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires, import/extensions
const { AdminMadness } = require('../../src/js/admin-madness.js');

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
});
