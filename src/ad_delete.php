<?php

$page_file = "ad_delete.php";
$page_title = "Delete Ad";

require ("functions/main_fns.php");
require ("functions/ads_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete an Ad</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        delete_ad($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="ad_view_all_active.php">View all Ads</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
