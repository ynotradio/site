<?php

$page_file = "schedule_copy_day.php";
$page_title = "Copy Schedule Day";

require ("../functions/main_fns.php");
require ("../functions/schedule_fns.php");
require ("../partials/_header.php");

$action = $_POST['action'];
$date = $_GET['date'];
$new_date = $_POST['new_date'];

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
      copy_schedule($date);
    } else {
      // Process the copy action
      if (empty($new_date)) {
        echo "<div class=\"center error\">Please enter a new date.</div>";
        copy_schedule($date);
      } else {
        // Format the date to ensure it's consistent
        $formatted_date = date("Y-m-d", strtotime($new_date));
        
        // Get the schedule entries for the source date
        $query = "SELECT date, day, start_time, end_time, host, note, deleted FROM schedule WHERE date = '$date' AND deleted = 'n'";
        $result = mysqli_query(open_db(), $query);
        
        if (!$result) {
          echo "<div class=\"center error\">Error retrieving schedule for $date.</div>";
        } else {
          $success = true;
          
          // Insert each entry with the new date
          while ($schedule = mysqli_fetch_assoc($result)) {
            $host = mysqli_real_escape_string(open_db(), $schedule['host']);
            $note = mysqli_real_escape_string(open_db(), $schedule['note']);
            $start_time = mysqli_real_escape_string(open_db(), $schedule['start_time']);
            $end_time = mysqli_real_escape_string(open_db(), $schedule['end_time']);
            $weekday = date('l', strtotime($formatted_date));
            
            $insert = "INSERT INTO schedule VALUES (id, '$formatted_date', '$weekday', '$start_time', '$end_time', '$host', '$note', 'n')";
            $insert_result = mysqli_query(open_db(), $insert);
            
            if (!$insert_result) {
              $success = false;
              echo "<div class=\"center error\">Error copying schedule entry: $insert</div>";
            }
          }
          
          if ($success) {
            echo "<div class=\"center success\">Successfully copied schedule from $date to $formatted_date.</div>";
          }
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
