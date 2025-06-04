<?php

$page_file = "schedule_copy_day.php";
$page_title = "Copy Schedule Day";

require ("../functions/main_fns.php");
require ("../models/ScheduleFactory.php");
require ("../partials/_header.php");

$action = $_POST['action'];
$date = $_GET['date'];
$new_date = $_POST['new_date'];
$db = open_db();
$scheduleModel = \YNotRadio\Models\ScheduleFactory::create($db);

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'], $_POST['remember_me'], $_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Copy Schedule Day</h1>
    <?php 
    if ($action != "copy") {
      // Display the copy form
      echo "<form action=\"schedule_copy_day.php?date=".$date."\" method=\"post\" class=\"form-internal input-seperation inline shorten\">
           <fieldset>
            <div class=\"control-group\">
              <label class=\"required\">New Date:</label>
              <div class=\"control\">
              <input type=\"text\" name=\"new_date\" class=\"date\" placeholder=\"YYYY/MM/DD\">
              </div>
            </div>
            <input type=\"hidden\" name=\"action\" value=\"copy\">
            <div class=\"center\"><input type=\"submit\" class=\"btn-inverse\" value=\"Copy Full Day\">
          </fieldset>
        </form>";
    } else {
      // Process the copy action
      if (empty($new_date)) {
        echo "<div class=\"center error\">Please enter a new date.</div>";
        echo "<form action=\"schedule_copy_day.php?date=".$date."\" method=\"post\" class=\"form-internal input-seperation inline shorten\">
             <fieldset>
              <div class=\"control-group\">
                <label class=\"required\">New Date:</label>
                <div class=\"control\">
                <input type=\"text\" name=\"new_date\" class=\"date\" placeholder=\"YYYY/MM/DD\">
                </div>
              </div>
              <input type=\"hidden\" name=\"action\" value=\"copy\">
              <div class=\"center\"><input type=\"submit\" class=\"btn-inverse\" value=\"Copy Full Day\">
            </fieldset>
          </form>";
      } else {
        try {
          // Format the date to ensure it's consistent
          $formatted_date = date("Y-m-d", strtotime($new_date));
          
          if ($scheduleModel->copyDay($date, $formatted_date)) {
            echo "<div class=\"center\"><h1>Success!</h1>
                <span class=\"success\">The full day has been copied.</span></div>
                <hr width=75%>";
            
            // Get the schedule for the new date and display it
            $daySchedule = $scheduleModel->getByDate($formatted_date);
            
            if (!empty($daySchedule)) {
              echo "<h3 class=\"center\">" . date('F d, Y', strtotime($formatted_date)) . "</h3>";
              
              echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
                   "<thead><tr><th width=125px>Time</th><th>Host</th><th>Notes</th></tr></thead>\n";
              
              foreach ($daySchedule as $entry) {
                if ($entry['stime'] != $entry['etime']) {
                  echo "<tr><td>";
                  if ($entry['start_min'] != "00")
                    echo $entry['stime']." - ";
                  else
                    echo $entry['stime_no_min']." - ";
            
                  if ($entry['end_min'] != "00")
                    echo $entry['etime'];
                  else
                    echo $entry['etime_no_min'];
            
                  echo "</td>\n<td>".$entry['host']."</td>\n<td>".$entry['note']."</td>\n";
                }
                
                if ($entry['stime'] == $entry['etime']) {
                  echo "<tr class=\"d1\"><td>All Day</td>\n<td>".$entry['host']."</td>\n<td>".$entry['note']."</td>\n";
                }
              }
              
              echo "</table>";
            }
          }
        } catch (\Exception $e) {
          echo "<div class=\"center error\">Error: " . $e->getMessage() . "</div>";
        }
      }
    }
    ?>
    <div class="top-spacer_20">
      <a href="schedule_view_all.php">View All Schedule</a> | 
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->

<?php
  }
  require ("../partials/_footer.php");
?>
