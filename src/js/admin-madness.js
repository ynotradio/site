/**
 * Modern Rock Madness – Admin voting & scoreboard polling (jQuery-free).
 *
 * Replaces the former jQuery-based admin_madness.js with vanilla DOM APIs.
 * Depends on no external libraries.
 *
 * Looks for:
 *   .vote_for_band1  /  .vote_for_band2  – vote buttons inside forms
 *   .scoreboard                          – container updated by polling
 *   #mrm_timer                           – countdown element (text checked)
 *
 * Exports AdminMadness for testing.
 */

const SCOREBOARD_POLL_MS = 5000;

const AdminMadness = {
  /** Start the scoreboard polling loop. */
  startScoreboardPolling() {
    AdminMadness.updateAdminScoreboard();

    setInterval(() => {
      if (document.querySelector('.scoreboard')) {
        AdminMadness.updateAdminScoreboard();
      }
    }, SCOREBOARD_POLL_MS);
  },

  /** Fetch updated scoreboard HTML and inject it into #live_match .scoreboard. */
  updateAdminScoreboard() {
    const timerEl = document.getElementById('mrm_timer');
    const timerText = timerEl ? timerEl.textContent : '';
    if (timerText === 'Match Over' || timerText === '00:00') return;

    const target = document.querySelector('#live_match .scoreboard');
    if (!target) return;

    fetch('partials/_update_admin_scoreboard.php')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => { target.innerHTML = html; })
      .catch(() => { /* silently retry next interval */ });
  },

  /**
   * Submit a vote via fetch and refresh the relevant scoreboard.
   * @param {HTMLFormElement} form – the <form> that wraps the vote button.
   */
  vote(form) {
    const matchInput = form.querySelector('#match') || form.querySelector('[name="match"]');
    const matchId = matchInput ? matchInput.value : '';

    fetch(window.location.href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then(() => {
        AdminMadness.updateMatchVotes(matchId);
      })
      .catch(() => { /* retry on next poll */ });
  },

  /**
   * Refresh the scoreboard for a single match by its id.
   * @param {string} matchId
   */
  updateMatchVotes(matchId) {
    const body = new URLSearchParams({ match_id: matchId });

    fetch('partials/_update_admin_scoreboard.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((html) => {
        const matchInput = document.querySelector(
          `input[name="match"][value="${matchId}"]`,
        );
        if (!matchInput) return;
        const table = matchInput.closest('table');
        if (!table) return;
        const scoreboard = table.querySelector('.scoreboard');
        if (scoreboard) scoreboard.innerHTML = html;
      })
      .catch(() => {});
  },

  /**
   * Collect legacy form values (kept for backward-compat if needed).
   * @param {string} formSelector – CSS selector for the form
   */
  values(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return '';
    const get = (id) => {
      const el = form.querySelector(`#${id}`);
      return el ? el.value : '';
    };
    return `action=${encodeURIComponent(get('action'))}&match=${encodeURIComponent(get('match'))}&band=${encodeURIComponent(get('band'))}&round=${encodeURIComponent(get('round'))}`;
  },
};

/** Wire up vote-button click handlers and polling on DOMContentLoaded. */
function _init() {
  document.querySelectorAll('.table-center form .vote_for_band1').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      AdminMadness.vote(btn.closest('form'));
    });
  });

  document.querySelectorAll('.table-center form .vote_for_band2').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      AdminMadness.vote(btn.closest('form'));
    });
  });

  AdminMadness.startScoreboardPolling();
}

if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  _init();
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', _init);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminMadness, _init };
}
