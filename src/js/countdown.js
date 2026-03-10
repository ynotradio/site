// MRM Countdown Timer & Scoreboard Updater
// Works with <mrm-scoreboard> and <mrm-match-card> web components.
// Falls back to jQuery for any remaining legacy selectors, but prefers
// vanilla DOM APIs where possible.

// eslint-disable-next-line no-use-before-define, no-var
var Madness = {
  startTimer: function(endtime, timer) {
    var currenttime = new Date();
    // Update the <mrm-match-card> timer-text attribute if present
    var matchCard = document.querySelector('mrm-match-card[status="running"]');
    var timerEl = document.getElementById('mrm_timer');
    var hasTarget = matchCard || timerEl;

    if (hasTarget) {
      Madness.timer = (Madness.endtime > currenttime);
      if (Madness.timer) {
        var tdiff = Madness.endtime - currenttime;
        var formatted = Madness.displayDiffFormat(tdiff);
        if (matchCard) matchCard.setAttribute('timer-text', formatted);
        if (timerEl) timerEl.textContent = formatted;
        setTimeout(function(){
          Madness.startTimer(Madness.endtime, Madness.timer);
        }, 1000);
      } else {
        if (matchCard) matchCard.setAttribute('timer-text', 'Match Over');
        if (timerEl) timerEl.textContent = 'Match Over';
        setTimeout(function(){ Madness.delayedRedirect(); }, 4000);
      }
    }
  },
  displayDiffFormat: function(diff) {
    const SEC = 1000, MIN = 60 * SEC, HRS = 60 * MIN;
    const hrs = Math.floor(diff/HRS).toLocaleString('en-US', {minimumIntegerDigits: 2});
    const min = Math.floor((diff%HRS)/MIN).toLocaleString('en-US', {minimumIntegerDigits: 2});
    const sec = Math.floor((diff%MIN)/SEC).toLocaleString('en-US', {minimumIntegerDigits: 2});
    if (hrs > 0) {
      return `${hrs}:${min}:${sec}`;
    } else {
      return `${min}:${sec}`;
  	}
  },
  delayedRedirect: function() {
    window.location = window.location.href;
  },
  updateScoreboard: function() {
    var scoreboard = document.getElementById('mrm_scoring');
    if (scoreboard && scoreboard.tagName === 'MRM-SCOREBOARD') {
      // Fetch updated data and update <mrm-scoreboard> attributes
      fetch('partials/_update_scoreboard.php')
        .then(function(res) { return res.text(); })
        .then(function(html) {
          Madness._parseAndUpdateScoreboard(scoreboard, html);
        })
        .catch(function() { /* retry next interval */ });
    } else if (typeof $ !== 'undefined') {
      // Fallback for legacy table-based scoreboard
      Madness.loadPartial('#mrm_scoring', 'partials/_update_scoreboard.php');
    }
    setTimeout(function() {
      if (Madness.timer)
        Madness.updateScoreboard();
    }, 5000);
  },
  /** Parse the server response (which may return an <mrm-scoreboard> or table HTML)
   *  and extract percentage values to update attributes. */
  _parseAndUpdateScoreboard: function(scoreboard, html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

    // Try to find an <mrm-scoreboard> in the response first
    var newBoard = doc.querySelector('mrm-scoreboard');
    if (newBoard) {
      scoreboard.setAttribute('band1-pct', newBoard.getAttribute('band1-pct') || '0');
      scoreboard.setAttribute('band2-pct', newBoard.getAttribute('band2-pct') || '0');
      scoreboard.setAttribute('band1-label', newBoard.getAttribute('band1-label') || '');
      scoreboard.setAttribute('band2-label', newBoard.getAttribute('band2-label') || '');
      return;
    }

    // Fallback: try old table format (#band1_score, #band1_value, etc.)
    var b1score = doc.getElementById('band1_score');
    var b2score = doc.getElementById('band2_score');
    var b1value = doc.getElementById('band1_value');
    var b2value = doc.getElementById('band2_value');
    if (b1score) scoreboard.setAttribute('band1-label', b1score.textContent.trim());
    if (b2score) scoreboard.setAttribute('band2-label', b2score.textContent.trim());
    if (b1value) scoreboard.setAttribute('band1-pct', b1value.getAttribute('width') || '0');
    if (b2value) scoreboard.setAttribute('band2-pct', b2value.getAttribute('width') || '0');
  },
  loadPartial: function(selector, partial) {
    if (typeof $ !== 'undefined') {
      $(selector).load(partial);
    }
  }
};

function _initMadness() {
  var hrEl = document.getElementById('hr');
  var minEl = document.getElementById('min');
  var secEl = document.getElementById('sec');

  if (hrEl && minEl && secEl) {
    Madness.starttime = new Date();
    var hrs = parseInt(hrEl.textContent, 10) || 0;
    var mins = parseInt(minEl.textContent, 10) || 0;
    var secs = parseInt(secEl.textContent, 10) || 0;
    Madness.endtime = new Date(Madness.starttime.getTime() + (1000 * ((hrs * 3600) + (mins * 60) + secs)));
    Madness.timer = (Madness.endtime > Madness.starttime);
    Madness.startTimer(Madness.endtime, Madness.timer);
  }
  Madness.updateScoreboard();
}

// Run init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState !== 'loading') {
    _initMadness();
  } else {
    document.addEventListener('DOMContentLoaded', _initMadness);
  }
}

// Export for testing (Node.js environment)
// In browser, this will be undefined and won't affect existing functionality
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Madness };
}
