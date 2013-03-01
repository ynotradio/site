$(document).ready(function() {
  Madness.timer = true
  Madness.startTimer($('#hr').text(), $('#min').text(), $('#sec').text(), Madness.timer);
  Madness.updateScoreboard();
});

Madness = {
  startTimer: function(hr, min, sec, timer) {
    if (sec > 0) {
      sec = sec - 1;
    } else {
      sec = 59;
      if (min > 0) {
        min = min - 1;
      } else {
        min = 59;
        if (hr > 0) {
          hr = hr - 1;
        } else {
          hr = 0;
          min = 0;
          sec = 0;
          Madness.timer = false;
        }
      }
    }

    if ($('#mrm_timer').size() > 0) {
      if (Madness.timer) {
        $('#mrm_timer').text(Madness.displayFormat(hr, min, sec));
        setTimeout(function(){
          Madness.startTimer(hr, min, sec, Madness.timer);}, 1000);
      } else {
        $('#mrm_timer').text("Match Over");
        setTimeout(function(){Madness.delayedRedirect();}, 4000);
      }
    }
  },
   displayFormat: function(hr, min, sec) {
    if (Madness.timeFormat(hr) === "00")
      return Madness.timeFormat(min) + ":" + Madness.timeFormat(sec);
    else
      return Madness.timeFormat(hr) + ":" + Madness.timeFormat(min) + ":" + Madness.timeFormat(sec);
  },
  timeFormat: function(n) {
    return n > 9 ? "" + n: "0" + n;
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
