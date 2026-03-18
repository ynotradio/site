<?php

$page_file = "schedule_view_all.php";
$page_title = "View All Schedules";

require ("../functions/main_fns.php");
require ("../functions/payload_fns.php");
require ("../models/ScheduleFactory.php");
require ("../partials/_header.php");

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
$db = open_db();
$scheduleModel = \YNotRadio\Models\ScheduleFactory::create($db);
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>View all Schedules</h1>
      <?php 
      $scheduleData = $scheduleModel->getAllForAdmin();
      
      echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
           "<thead><th width=125px>Time</th><th>Host</th><th>Notes</th><th colspan=3><center>Actions</center></th></thead>\n";
      
      foreach ($scheduleData as $day) {
          $date_info = $day['date_info'];
          echo "<tr class=\"subheader\"><td colspan=3>". $date_info['day'] ." - ". $date_info['fdate'] ."</td>\n".
               "<td colspan=3><div class=\"center\"><a href=\"schedule_copy_day.php?date=". $date_info['date'] ."\">Copy Full Day</a><div></td></tr>\n";
          
          foreach ($day['entries'] as $entry) {
              if ($entry['stime'] != $entry['etime']) {
                  echo "<tr>\n<td>";
                  if ($entry['start_min'] != "00")
                      echo $entry['stime']." - ";
                  else
                      echo $entry['stime_no_min']." - ";
      
                  if ($entry['end_min'] != "00")
                      echo $entry['etime'];
                  else
                      echo $entry['etime_no_min'];
      
                  echo "</td>\n<td>".$entry['host']."</td>
                      <td>".$entry['note']."</td>
                      <td><a href=\"schedule_update.php?id=".$entry['id']."\">Edit</a></td><td><a href=\"schedule_delete.php?id=".$entry['id']."\">Delete</a></td><td><a href=\"schedule_update.php?action=copy&id=".$entry['id']."\">Copy</a></td></tr>\n";
              }
              
              if ($entry['stime'] == $entry['etime']) {
                  echo "<tr><td>All Day</td>\n<td>".$entry['host']."</td>\n<td>".$entry['note']."</td>\n";
                  echo "<td><a href=\"schedule_update.php?id=".$entry['id']."\">Edit</a></td><td><a href=\"schedule_delete.php?id=".$entry['id']."\">Delete</a></td><td><a href=\"schedule_update.php?action=copy&id=".$entry['id']."\">Copy</a></td></tr>\n";
              }
          }
      }
      
      echo "</table>";
      ?>
    <div class="top-spacer_20">
      <a href="<?php echo htmlspecialchars(get_payload_collection_url('shows')); ?>" target="_blank">View in Payload ↗</a>
      <p>
      <a href="index.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
