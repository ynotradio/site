$(document).ready(function() {
  AdminMadness.band1VoteWatcher();
  AdminMadness.band2VoteWatcher();
});

AdminMadness = {
  updateAdminScoreboard: function() {
      if ($('#mrm_timer').text() != "Match Over" && $('#mrm_timer').text() != "00:00")    
      Madness.loadPartial('#live_match .scoreboard', 'partials/_update_admin_scoreboard.php');
    setTimeout(function() {
      if (Madness.timer)
        AdminMadness.updateAdminScoreboard();
    }, 5000);
  },
  band1VoteWatcher: function() {
    $('#live_match form .vote_for_band1').click(function(e) {
      e.preventDefault();
      AdminMadness.vote('#live_match form.for_band1');
    });
  },
  band2VoteWatcher: function() {
    $('#live_match form .vote_for_band2').click(function(e) {
      e.preventDefault();
      AdminMadness.vote('#live_match form.for_band2');
    });
  },
  vote: function(form) {
    $.ajax({
      type: "POST",
      url: window.location.href,
      data: AdminMadness.values(form),
      success: function(data) {
        AdminMadness.updateAdminScoreboard();
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
