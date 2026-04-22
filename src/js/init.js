$(document).ready(function() {
  $('.date').pickadate();
  $('.time').pickatime();

  // Mobile navigation toggle. The menu starts open (no-JS fallback);
  // collapse it on init, then toggle on click.
  var $navList = $('nav ul');
  var $btn = $('.nav-toggle');
  if ($btn.length) {
    $navList.addClass('is-collapsed');
    $btn.attr('aria-expanded', 'false');
    $btn.on('click', function() {
      var isExpanded = $btn.attr('aria-expanded') === 'true';
      $btn.attr('aria-expanded', String(!isExpanded));
      $navList.toggleClass('is-collapsed', isExpanded);
    });
  }
});
