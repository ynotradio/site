<?php

$page_file = "year_end_staff_picks_delete.php";
$page_title = "Delete Year End Staff Picks";

require ("functions/main_fns.php");
require ("functions/year_end_staff_pick_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Year End Staff Pick</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        delete_year_end_staff_pick($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="year_end_staff_picks_view_all.php">View all Year End Staff Picks</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
