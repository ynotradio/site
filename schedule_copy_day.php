<?php

$page_file = "schedule_copy_day.php";
$page_title = "Schedule Copy Day";

require ("functions/main_fns.php");
require ("partials/_header.php");
require ("functions/schedule_fns.php");

$action = $_POST['action'];
$date = $_GET['date'];

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Copy Full Day</h1>
<?php
  if (!$date)
    echo '<div class="top-spacer_20 center error">Error - missing date value</div>';
  elseif (!$action) {
    display_day($date);
    echo "<p>";
    copy_schedule($date);
  } else { 
    $new_date = $_POST['new_date'];
    
    if (!$new_date)
      echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
    else
      copy_day($new_date, $date);
  }
?>
    <div class="top-spacer_20">
      <a href="schedule_view_all.php">View all Schedules</a>
      <p>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
