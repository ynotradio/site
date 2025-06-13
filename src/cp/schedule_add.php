<?php

$page_file = "schedule_add.php";
$page_title = "Add a Schedule";

require("../functions/main_fns.php");
require("../models/ScheduleFactory.php");
require("../partials/_header.php");

$action = $_POST['action'];
$id = $_GET['id'];
$db = open_db();
$scheduleModel = \YNotRadio\Models\ScheduleFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {

  /*----- CONTENT ------*/
?>
  <div class="row">
    <div class="tweleve columns content full-width">
      <h1>Add a Schedule</h1>
      <?php if ($action != "insert") { ?>
        <form action="schedule_add.php" method="post" class="form-internal inline input-seperation" id="admin">
          <?php require("../partials/_schedule_form.php"); ?>
        </form>
        <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
        <?php
      } else {
        $host = $_POST['host'];
        $date = $_POST['date'];
        $start_time = $_POST['start_time'];
        $end_time = $_POST['end_time'];
        $note = $_POST['note'];

        // Convert 12-hour format with AM/PM to 24-hour format for database
        if ($start_time) {
          $start_time = date('H:i:s', strtotime($start_time));
        }
        
        if ($end_time) {
          $end_time = date('H:i:s', strtotime($end_time));
        }

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
        ?>
            <div class="center">
              <h1>Success!</h1>
              <h3>New Schedule for <?= htmlspecialchars($host) ?> on <?= htmlspecialchars($date) ?> has been saved</h3>
              <hr width=75%>

              <br><b>Host:</b> <?= htmlspecialchars($newSchedule['host']) ?>
              <br><b>Date:</b> <?= date('F jS', strtotime($newSchedule['date'])) ?>
              <br><b>Day:</b> <?= htmlspecialchars($newSchedule['day']) ?>
              <br><b>Start Time:</b> <?= date('g:i a', strtotime($newSchedule['start_time'])) ?>
              <br><b>End Time:</b> <?= date('g:i a', strtotime($newSchedule['end_time'])) ?>
              <br><b>Note:</b> <?= htmlspecialchars($newSchedule['note']) ?>
            </div>
      <?php
          } catch (\Exception $e) {
            echo '<div class="top-spacer_20 center error">Error: ' . $e->getMessage() . '</div>';
          }
        }
      }
      ?>
      <div class="top-spacer_20">
        <?php if ($action == 'insert'): ?>
          <a href="<?= $page_file ?>">Add another Schedule</a>
          <p>
          <?php endif; ?>
          <a href="index.php">Control Panel</a>
      </div>
    </div>
  </div> <!-- end of row div -->
<?php }
require("../partials/_footer.php");
?>
