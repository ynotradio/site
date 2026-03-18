<?php
ob_start();

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

// Only require necessary dependencies
require "models/ModernRockMadnessFactory.php";
require "controllers/MadnessController.php";

// Initialize the Modern Rock Madness controller with database connection
$db = open_db();
try {
    $madnessController = new \YNotRadio\Controllers\MadnessController($db);
} catch (Exception $e) {
    error_log("MRM Controller Error: " . $e->getMessage());
    die("Modern Rock Madness initialization failed. Please contact support.");
}

// Override hardcoded config values with DB values when available (Postgres mode)
$dbStartDate = $madnessController->getStartDate();
if ($dbStartDate !== null) {
    $madness_start_date = $dbStartDate;
}
$dbBracketPdfUrl = $madnessController->getBracketPdfUrl();
if ($dbBracketPdfUrl !== null) {
    $madness_bracket_pdf_url = $dbBracketPdfUrl;
}
$dbBannerImageUrl = $madnessController->getBannerImageUrl();
if ($dbBannerImageUrl !== null) {
    $madness_banner_image_url = $dbBannerImageUrl;
}

/**
 * Render first row content based on controller logic
 */
function render_first_row($tournament_date = null) {
    global $madnessController;
    
    $content = $madnessController->getFirstRowContent($tournament_date);
    
    switch ($content['type']) {
        case 'champion':
            $madnessController->renderChampionBanner($tournament_date);
            break;
            
        case 'waiting':
            echo "<div class=\"top-spacer_20 center\"><strong>Hang in there, we are still counting up all of the votes...</strong></div>";
            break;
            
        case 'next_match':
            $madnessController->renderNextMatchDisplay($tournament_date);
            break;
    }
}

// Get data from controller
$current_match = $madnessController->getCurrentMatch();
$match_id = $_POST['match_id'] ?? null;
$band_id = $_POST['band_id'] ?? null;
$voter_email = $_POST['voter_email'] ?? null;

// Process vote before any HTML output so Auth0 can set cookies/headers
if ($match_id && $band_id) {
    $vote_processed = $madnessController->processVote($match_id, $band_id, $voter_email);
    if (!$vote_processed) {
        error_log("Vote processing failed for match: $match_id, band: $band_id");
    }
}

// All header-modifying operations complete — now output HTML
$GLOBALS['auth0'] = $auth0;
$userInfo = $auth0->getUser();
$voter_email_for_body = $userInfo['email'] ?? null;
require "partials/_header.php";

// Set voter email on body for the vote bridge JS
if ($voter_email_for_body) {
    echo '<script>document.body.setAttribute("data-voter-email", ' . json_encode($voter_email_for_body) . ');</script>';
}

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
	<a href="madness.php"><img src="<?php echo $madness_banner_image_url; ?>" alt="Modern Rock Madness <?php echo $madnessController->getTournamentYear($madness_start_date); ?>" width="930px"></a>
    <div class="mrm-text" id="mrm_text">
      <p>Download your Modern Rock Madness <?php echo $madnessController->getTournamentYear($madness_start_date); ?> brackets <a href="<?php echo $madness_bracket_pdf_url; ?>">here</a> and listen all throughout the tournament as Y-Not bands go head to head! Help your favorites advance to the next round by voting here, or if you're listening on the go, you can text your votes in to 707-800-YNOT.</p>

      <div class="social">
        <a href="https://twitter.com/share" class="twitter-share-button" data-text="Tune in now to @YNotRadio's Modern Rock Madness - 64 bands go head to head! #modernrockmadness" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <div class="fb-like" data-href="http://www.ynotradio.net/madness.php?<?php echo $madnessController->getTournamentYear($madness_start_date); ?>" data-send="true" data-width="450" data-show-faces="false"></div>
      </div>
    </div>
<?php

// Render match using controller
$madnessController->renderMatchDisplay($current_match['id'], $madness_start_date);
$madnessController->renderScoreboard($current_match);
render_first_row($madness_start_date);
$madnessController->renderTournamentTimeline($madness_start_date);
$madnessController->renderBracketDisplay($madness_start_date);
?>

  </div>
</div>
<?php require "partials/_footer.php"; ?>
