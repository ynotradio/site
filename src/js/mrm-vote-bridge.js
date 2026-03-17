/**
 * MRM Vote Bridge – connects <mrm-match-card> mrm-vote events to the
 * legacy server-side PHP vote handler via form POST.
 *
 * Listens for `mrm-vote` CustomEvents (dispatched by the web component)
 * and submits a POST to madness.php with the match_id and band_id fields,
 * replicating the original <form> behaviour from _mrm_vote_form.php.
 *
 * The voter_email is read from the data-voter-email attribute on <body>
 * (set by the PHP page when the user is authenticated).
 */

function initVoteBridge() {
  document.addEventListener('mrm-vote', function handleVote(e) {
    var detail = e.detail || {};
    var matchId = detail.matchId;
    var band = detail.band; // "1" or "2"
    if (!matchId || !band) return;

    // Read voter email from body data attribute (set by PHP when logged in)
    var voterEmail = document.body.getAttribute('data-voter-email') || '';
    if (!voterEmail) {
      // Not logged in – redirect to login
      window.location.href = 'auth_login.php?returnTo=' + encodeURIComponent(window.location.pathname);
      return;
    }

    var form = document.createElement('form');
    form.method = 'POST';
    form.action = window.location.pathname;
    form.style.display = 'none';

    var fields = {
      match_id: matchId,
      band_id: band,
      voter_email: voterEmail,
    };

    Object.keys(fields).forEach(function addField(name) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = fields[name];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  });
}

if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  initVoteBridge();
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initVoteBridge);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initVoteBridge };
}
