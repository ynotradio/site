$(document).ready(function() {
  AdminMadness.band1VoteWatcher();
  AdminMadness.band2VoteWatcher();
  AdminMadness.startScoreboardPolling();
});

AdminMadness = {
  updateAdminScoreboard: function() {
    if ($('#mrm_timer').text() != "Match Over" && $('#mrm_timer').text() != "00:00") {
      Madness.loadPartial('#live_match .scoreboard', 'partials/_update_admin_scoreboard.php');
    }
  },
  startScoreboardPolling: function() {
    // Initial update
    AdminMadness.updateAdminScoreboard();
    
    // Setup regular polling (every 5 seconds)
    setInterval(function() {
      if ($('.scoreboard').length > 0) {
        AdminMadness.updateAdminScoreboard();
      }
    }, 5000);
  },
  band1VoteWatcher: function() {
    $('.table-center form .vote_for_band1').click(function(e) {
      e.preventDefault();
      var form = $(this).closest('form');
      AdminMadness.vote(form);
    });
  },
  band2VoteWatcher: function() {
    $('.table-center form .vote_for_band2').click(function(e) {
      e.preventDefault();
      var form = $(this).closest('form');
      AdminMadness.vote(form);
    });
  },
  vote: function(form) {
    var matchId = $(form).find('#match').val();
    
    $.ajax({
      type: "POST",
      url: window.location.href,
      data: $(form).serialize(),
      success: function(data) {
        // Update the votes for this specific match
        AdminMadness.updateMatchVotes(matchId);
      }
    });
  },
  updateMatchVotes: function(matchId) {
    $.ajax({
      type: "POST",
      url: "partials/_update_admin_scoreboard.php",
      data: { match_id: matchId },
      success: function(data) {
        // Find the right match and update its scoreboard
        var matchTable = $('input[name="match"][value="' + matchId + '"]').closest('table');
        if (matchTable.length > 0) {
          matchTable.find('.scoreboard').html(data);
        }
      }
    });
  },
  values: function(form){
    var action = $(form + ' #action').val();
    var match = $(form + ' #match').val();
    var band = $(form + ' #band').val();
    var round = $(form + ' #round').val();

    return 'action=' + action + '&match=' + match + '&band=' + band + '&round=' + round;
  }
};
