$(document).ready(function() {
  $('.date').pickadate();
  $('.time').pickatime();

  // ── Mobile header: Recently Played panel toggle ──
  var $headerMobile = $('.header-mobile');
  var $onAirBtn = $('.action-btn--onair');
  var $npPanel = $('#np-panel');

  function setMarqueePaused(paused) {
    $headerMobile.toggleClass('is-marquee-paused', !!paused);
  }

  if ($onAirBtn.length && $npPanel.length) {
    $npPanel.removeAttr('hidden');
    $onAirBtn.on('click', function() {
      var open = !$npPanel.hasClass('is-open');
      $npPanel.toggleClass('is-open', open);
      $onAirBtn.attr('aria-expanded', String(open));
      // Marquee stays visible alongside the recently-played panel — they show
      // complementary info (current vs history). Only the drawer pauses it.
    });
  }

  // ── Mobile drawer: open/close + body scroll lock ──
  var $drawer = $('#mobile-drawer');
  var $overlay = $('.mobile-drawer-overlay');
  var $menuBtn = $('.action-btn--menu');
  var $closeBtn = $('.mobile-drawer__close');

  function openDrawer() {
    $drawer.attr('aria-hidden', 'false');
    $overlay.removeAttr('hidden').addClass('is-open');
    $menuBtn.attr('aria-expanded', 'true');
    $('body').addClass('drawer-open');
    setMarqueePaused(true);
  }

  function closeDrawer() {
    $drawer.attr('aria-hidden', 'true');
    $overlay.removeClass('is-open');
    $menuBtn.attr('aria-expanded', 'false');
    $('body').removeClass('drawer-open');
    setMarqueePaused(false);
  }

  if ($drawer.length) {
    $overlay.removeAttr('hidden'); // CSS handles visibility via .is-open
    $menuBtn.on('click', openDrawer);
    $closeBtn.on('click', closeDrawer);
    $overlay.on('click', closeDrawer);
    $(document).on('keydown', function(e) {
      if (e.key === 'Escape' && $drawer.attr('aria-hidden') === 'false') {
        closeDrawer();
      }
    });
  }

  // ── Marquee + Recently Played: poll JSON endpoint every 30s ──
  var $marqueeText = $('.np-marquee__text');
  var $recentList = $('[data-recent-list]');
  if ($marqueeText.length || $recentList.length) {
    setInterval(function() {
      $.getJSON('partials/_now_playing.php?json=1').done(function(data) {
        if (!data || !data.available) return;
        var label = [data.artist, data.title].filter(Boolean).join(' – ');
        if (label && $marqueeText.length && label !== $marqueeText.text()) {
          $marqueeText.text(label);
        }
        if ($recentList.length && Array.isArray(data.lastPlayed) && data.lastPlayed.length) {
          var html = data.lastPlayed.map(function(t) {
            var a = $('<div/>').text(t.artist || '').html();
            var ti = $('<div/>').text(t.title || '').html();
            return '<li><strong>' + a + '</strong>' +
              (a && ti ? ' <span class="np-panel__sep">–</span> ' : '') +
              '<em>' + ti + '</em></li>';
          }).join('');
          $recentList.html(html);
        }
      });
    }, 30000);
  }
});

