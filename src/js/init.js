$(document).ready(function() {
  $('.date').pickadate();
  $('.time').pickatime();

  // ── Mobile header: On Air panel toggle ──
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
      setMarqueePaused(open || $('body').hasClass('drawer-open'));
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
    setMarqueePaused($npPanel.hasClass('is-open'));
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

  // ── Marquee: poll the JSON endpoint for fresh artist/title every 30s ──
  var $marqueeText = $('.np-marquee__text');
  if ($marqueeText.length) {
    setInterval(function() {
      $.getJSON('partials/_now_playing.php?json=1').done(function(data) {
        if (!data || !data.available) return;
        var label = [data.artist, data.title].filter(Boolean).join(' – ');
        if (label && label !== $marqueeText.text()) {
          $marqueeText.text(label);
        }
      });
    }, 30000);
  }
});

