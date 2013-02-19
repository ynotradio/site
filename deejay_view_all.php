<?php

$page_file = "deejay_view_all.php";
$page_title = "View All DeeJays";

require ("functions/main_fns.php");
require ("functions/deejay_fns.php");
require ("partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Concerts</h1>
      <?php view_all_deejays(); ?>
    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
