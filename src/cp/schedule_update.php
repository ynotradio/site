<?php

$page_file = "schedule_update.php";
$page_title = "Update Schedule";

require ("../functions/main_fns.php");
require ("../models/ScheduleFactory.php");
require ("../partials/_header.php");

$id = $_GET['id'];
$db = open_db();
$scheduleModel = \YNotRadio\Models\ScheduleFactory::create($db);

if ($id != '') {
  $schedule = $scheduleModel->getById($id);
}

if ($_POST['action'] != "update") {
  $action = "update";
}

if ($_GET['action'] == "copy") {
  $action = "copy";
}

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Schedule</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update") {
        echo "<form action=\"schedule_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_schedule_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } elseif ($action == "copy") {
        echo "<form action=\"schedule_add.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("../partials/_schedule_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } else {
        $host = $_POST['host'];
        $date = $_POST['date'];
        $start_time = $_POST['start_time'];
        $end_time = $_POST['end_time'];
        $note = $_POST['note'];

        if (!$host || !$date || !$start_time || !$end_time) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          try {
            $scheduleData = [
              'host' => $host,
              'date' => $date,
              'start_time' => $start_time,
              'end_time' => $end_time,
              'note' => $note
            ];
            
            if ($scheduleModel->update($id, $scheduleData)) {
              $updatedSchedule = $scheduleModel->getById($id);
              echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
              
              echo "<br><b>Host:</b> ". $updatedSchedule['host'].
                   "<br><b>Date:</b> ". date('F jS', strtotime($updatedSchedule['date'])).
                   "<br><b>Day:</b> " . $updatedSchedule['day'].
                   "<br><b>Start Time:</b> ". date('g:i a', strtotime($updatedSchedule['start_time'])).
                   "<br><b>End Time:</b> ". date('g:i a', strtotime($updatedSchedule['end_time'])).
                   "<br><b>Note:</b> ". $updatedSchedule['note'];
              
              echo "</div>";
            }
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
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
