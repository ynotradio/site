$(document).ready(function() {
  Madness.starttime = new Date();
  Madness.endtime = new Date(Madness.starttime.getTime() + (1000*(($('#hr').text()*60*60)+($('#min').text()*60)+($('#sec').text()*1))));
  Madness.timer = (Madness.endtime > Madness.starttime);
  Madness.startTimer(Madness.endtime, Madness.timer);
  Madness.updateScoreboard();
});

Madness = {
  startTimer: function(endtime, timer) {
    currenttime = new Date();
    if ($('#mrm_timer').size() > 0) {
      Madness.timer = (Madness.endtime > currenttime);
      if (Madness.timer) {
        let tdiff = Madness.endtime - currenttime;
        $('#mrm_timer').text(Madness.displayDiffFormat(tdiff));
        setTimeout(function(){
          Madness.startTimer(Madness.endtime, Madness.timer);}, 1000);
      } else {
        $('#mrm_timer').text("Match Over");
        setTimeout(function(){Madness.delayedRedirect();}, 4000);
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
    Madness.loadPartial('#mrm_scoring', 'partials/_update_scoreboard.php');
    setTimeout(function() {
      if (Madness.timer)
        Madness.updateScoreboard();
    }, 5000);
  },
  loadPartial: function(selector, partial) {
    $(selector).load(partial);
  }
};
