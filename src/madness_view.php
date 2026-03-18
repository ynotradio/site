<?php

$page_file = "madness_view.php";
$page_title = "Modern Rock Madness Bracket";

// Load configuration settings
require "partials/_mrm_config.php";

require "functions/main_fns.php";

// Only require necessary dependencies
require "models/ModernRockMadnessFactory.php";
require "controllers/MadnessController.php";
require "partials/_header.php";

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

/*----- CONTENT ------*/
?>

<div class="row">
  <div class="twelve columns">
  <a href="madness.php"><img src="<?php echo $madness_banner_image_url; ?>" alt="Modern Rock Madness <?php echo $madnessController->getTournamentYear($madness_start_date); ?>" width="930px"></a>
    <div class="mrm-text" id="mrm_text">
  <p>Download your Modern Rock Madness <?php echo $madnessController->getTournamentYear($madness_start_date); ?> brackets <a href="<?php echo $madness_bracket_pdf_url; ?>">here</a>. <a href="madness.php">Click here to vote</a> in the current match!</p>
      <div class="social">
        <a href="https://twitter.com/share" class="twitter-share-button" data-text="Tune in now to @YNotRadio's Modern Rock Madness - 64 bands go head to head! #modernrockmadness" data-count="none" data-via="YNotRadio">Tweet</a><script type="text/javascript" src="//platform.twitter.com/widgets.js"></script>
        <div class="fb-like" data-href="http://www.ynotradio.net/madness.php?<?php echo $madnessController->getTournamentYear($madness_start_date); ?>" data-send="true" data-width="450" data-show-faces="false"></div>
      </div>
    </div>
<?php
// Render bracket using controller
render_first_row($madness_start_date);
$madnessController->renderBracketDisplay($madness_start_date);
$madnessController->renderSponsorInfo($current_match['id']);
?>

  </div>
</div>
<?php require "partials/_footer.php"; ?>
