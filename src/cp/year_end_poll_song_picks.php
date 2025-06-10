<?php

$page_file = "year_end_poll_song_picks.php";
$page_title = "Year End Poll Contestant's Song Picks";

require ("../functions/main_fns.php");
require ("../controllers/YearEndPollAdminController.php");
require ("../partials/_header.php");

// Initialize the controller
$db = open_db();
$controller = new \YNotRadio\Controllers\YearEndPollAdminController($db);

$contestant_id = isset($_GET['contestant_id']) ? (int)$_GET['contestant_id'] : 0;

if (!isset($_SESSION["logged_in"]) || !$_SESSION["logged_in"]) {
  login_prompt($_POST['username'] ?? null, $_POST['remember_me'] ?? null, $_SESSION["error"] ?? null);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content full-width">
    <h1>Year End Poll Contestant's Song Picks</h1>
    <?php $controller->renderContestantSongPicks($contestant_id); ?>
    <br>
    <div class="top-spacer_20">
      <a href="year_end_poll_contestants.php">View all Year End Poll Contestants</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
