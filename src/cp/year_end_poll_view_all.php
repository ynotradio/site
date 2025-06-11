<?php

$page_file = "year_end_poll_view_all.php";
$page_title = "View All Year End Polls";

require ("../functions/main_fns.php");
require ("../controllers/YearEndPollAdminController.php");
require ("../partials/_header.php");

// Initialize the controller
$db = open_db();
$controller = new \YNotRadio\Controllers\YearEndPollAdminController($db);

$poll = 'songs';
if (isset($_POST['poll']) && $_POST['poll'] != '') {
	$poll = $_POST['poll'];
}
if (isset($_GET['poll']) && $_GET['poll'] != '') {
	$poll = $_GET['poll'];
}

if (!isset($_SESSION["logged_in"]) || !$_SESSION["logged_in"]) {
  login_prompt($_POST['username'] ?? null, $_POST['remember_me'] ?? null, $_SESSION["error"] ?? null);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content full-width">
    <h1>View all Year End Polls | <?php echo ucwords($controller->formatPollName($poll)) ?> </h1>
    <form action="year_end_poll_view_all.php" method="post">
      <select name="poll" onchange="javascript:this.form.submit();">
      <?php $polls = $controller->getPollNames();
                        
      foreach ($polls as $title) {
          if ($title == $poll)
            echo '<option value="'.$title.'" selected="'. $title .'">' . ucwords($controller->formatPollName($title)) . '</option>'. "\n";
          else
            echo '<option value="'.$title.'">' . ucwords($controller->formatPollName($title)) . '</option>'. "\n";
          } ?>
      </select>
    </form>
  <div class="row">
    <div class="twelve columns content full-width">
    <?php $controller->renderPollResults($poll); ?>
    </div>
  </div>
  <?php $controller->renderPollWriteIns($poll); ?>

    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
