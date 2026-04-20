$(document).ready(function() {  
  $('.date').pickadate();
  $('.time').pickatime();

  // Mobile navigation toggle
  $('.nav-toggle').on('click', function() {
    var $btn = $(this);
    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-expanded', String(!isExpanded));
    $('nav ul').toggleClass('is-open');
  });
});
