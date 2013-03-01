<?php

$page_file = "mrm_view_all.php";
$page_title = "View All Modern Rock Madness Bands";

require ("functions/main_fns.php");
require ("functions/mrm_fns.php");
require ("partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Modern Rock Madness Bands</h1>
      <?php view_all_mrm_bands(); ?>
    <div class="top-spacer_20">
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
