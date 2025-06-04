<?php

$page_file = "schedule_delete.php";
$page_title = "Delete a Schedule";

require ("../functions/main_fns.php");
require ("../models/ScheduleFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];
$db = open_db();
$scheduleModel = \YNotRadio\Models\ScheduleFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
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
        try {
          $schedule = $scheduleModel->getById($id);
          if ($scheduleModel->delete($id)) {
            echo "<div class=\"center\"><h1>Success!</h1>".
              "<h3><span class=\"success\">". $schedule['host'] ." on ".  $schedule['date'] ."</span> has been deleted.</h3></div>";
          }
        } catch (\Exception $e) {
          echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="schedule_view_all.php">View all Schedules</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
