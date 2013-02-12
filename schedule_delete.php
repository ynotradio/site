<?php

$page_file = "schedule_delete.php";
$page_title = "Delete a Schedule";

require ("functions/main_fns.php");
require ("functions/schedule_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Delete a Schedule</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } else {
        delete_schedule($id);
      }
    ?>
    <div class="top-spacer_20">
      <a href="schedule_view_all.php">Back to view all schedules</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
