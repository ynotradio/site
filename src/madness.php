<?php

$page_file = "madness.php";
$page_title = "Modern Rock Madness";

// Load configuration settings
require "partials/_mrm_config.php";

// Check for preview parameter to bypass time-based redirect
$preview_mode = isset($_GET['preview']) && $_GET['preview'] === 'true';

// Only redirect if tournament hasn't started and we're not in preview mode
if (strtotime($madness_start_date) > strtotime('now') && !$preview_mode) {
    header('Location: /pages.php?page=modern-rock-madness');
}

require "functions/main_fns.php";

$uri = $_SERVER["HTTP_HOST"];
$protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

$auth0 = new Auth0\SDK\Auth0([
    'domain' => $_ENV['AUTH0_DOMAIN'],
    'client_id' => $_ENV['AUTH0_CLIENT_ID'],
    'client_secret' => $_ENV['AUTH0_CLIENT_SECRET'],
    'redirect_uri' => $protocol . "://" . $uri . "/madness",
    // The scope determines what data is provided in the ID token.
    // See: https://auth0.com/docs/scopes/current
    'scope' => 'openid email profile',
]);

require "functions/mrm_fns.php";
require "partials/_header.php";

$current_match = now_match();

$match_id = $_POST['match_id'];
$band_id = $_POST['band_id'];

/*----- CONTENT ------*/
?>

<!-- <?php echo date('Y-m-d H:i:s'); ?> -->
<?php if ($preview_mode): ?>
<div style="background-color: #FFEB3B; color: #000; padding: 10px; text-align: center; margin-bottom: 10px; border-radius: 4px;">
  <strong>Preview Mode:</strong> Viewing tournament before the official start date (<?php echo date('F j, Y', strtotime($madness_start_date)); ?>)
</div>
<?php endif; ?>

<div class="row">
  <div class="twelve columns">
	<a href="madness.php"><img src="<?php echo $madness_banner_image_url; ?>" alt="Modern Rock Madness <?php echo get_tournament_year($madness_start_date); ?>" width="930px"></a>
    <div id="mrm_text">
      <p>Download your Modern Rock Madness <?php echo get_tournament_year($madness_start_date); ?> brackets <a href="<?php echo $madness_bracket_pdf_url; ?>">here</a> and listen all throughout the tournament as Y-Not bands go head to head! Help your favorites advance to the next round by voting here, or if you're listening on the go, you can text your votes in to 707-800-YNOT.</p>

      <div class="social">
        <a href="https://twitter.com/share" class="twitter-share-button" data-text="Tune in now to @YNotRadio's Modern Rock Madness - 64 bands go head to head! #modernrockmadness" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <div class="fb-like" data-href="http://www.ynotradio.net/madness.php?<?php echo get_tournament_year($madness_start_date); ?>" data-send="true" data-width="450" data-show-faces="false"></div>
      </div>
    </div>
<?php

if ($band_id && $match_id) {
    vote($match_id, $band_id, false);
}

show_match($current_match['id'], $madness_start_date);
display_first_row($madness_start_date);
display_bracket();
?>

  </div>
</div>
<?php require "partials/_footer.php"; ?>
