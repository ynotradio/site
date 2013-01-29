<?php

$page_file = "cdotw_view_all.php";
$page_title = "View All CD of the Weeks";

require ("functions/main_fns.php");
require ("functions/cdotw_fns.php");
require ("partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>All (last 64) CDs of the Weeks</h1>
      <?php view_all_cdotw(); ?>
    <div class="top-spacer_20">
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
