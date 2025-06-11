<?php

$page_file = "year_end_poll_contestants.php";
$page_title = "View All Year End Poll Contestants";

require ("../functions/main_fns.php");
require ("../controllers/YearEndPollAdminController.php");
require ("../partials/_header.php");

// Initialize the controller
$db = open_db();
$controller = new \YNotRadio\Controllers\YearEndPollAdminController($db);

if (!isset($_SESSION["logged_in"]) || !$_SESSION["logged_in"]) {
  login_prompt($_POST['username'] ?? null, $_POST['remember_me'] ?? null, $_SESSION["error"] ?? null);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content full-width">
    <h1>View all Year End Poll Contestants</h1>
    <?php $controller->renderContestants(); ?>
    
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
