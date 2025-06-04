<?php

$page_file = "schedule_add.php";
$page_title = "Add a Schedule";

require ("../functions/main_fns.php");
require ("../models/ScheduleFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];
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
    <h1>Add a Schedule</h1>
      <?php if ($action != "insert") { ?>
      <form action="schedule_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("../partials/_schedule_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
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
            
            $newId = $scheduleModel->add($scheduleData);
            $newSchedule = $scheduleModel->getById($newId);
            
            echo "<div class=\"center\"><h1>Success!</h1>".
               "<h3>New Schedule for ". $host ." on " .$date . " has been saved</h3>".
               "<hr width=75%>";
            
            echo "<br><b>Host:</b> ". $newSchedule['host'].
                 "<br><b>Date:</b> ". date('F jS', strtotime($newSchedule['date'])).
                 "<br><b>Day:</b> " . $newSchedule['day'].
                 "<br><b>Start Time:</b> ". date('g:i a', strtotime($newSchedule['start_time'])).
                 "<br><b>End Time:</b> ". date('g:i a', strtotime($newSchedule['end_time'])).
                 "<br><b>Note:</b> ". $newSchedule['note'];
            
            echo "</div>";
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Schedule</a>\n<p>";
      ?>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
