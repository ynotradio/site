<?php

$page_file = "mrm_view_all.php";
$page_title = "View All Modern Rock Madness Bands";

require ("../functions/main_fns.php");
require ("../controllers/MadnessController.php");
require ("../controllers/MadnessAdminController.php");
require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
  $db = open_db();
  $adminController = new \YNotRadio\Controllers\MadnessAdminController($db);
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Modern Rock Madness Bands</h1>
      <?php $adminController->displayAllBands(); ?>
    <div class="top-spacer_20">
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
