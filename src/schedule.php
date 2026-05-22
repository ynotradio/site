<?php

$page_file = "schedule.php";
$page_title = "Schedule";

require ("functions/main_fns.php");
require ("models/ScheduleFactory.php");
require ("partials/_header.php");

$scheduleModel = \YNotRadio\Models\ScheduleFactory::create();

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Schedule</h1>
    <?php 
    // Get upcoming schedule and display it
    $scheduleData = $scheduleModel->getUpcoming(7);
    
    echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
         "<thead><tr><th width=130px>Time</th><th>Host</th><th>Notes</th></thead></tr>\n";
    
    foreach ($scheduleData as $day) {
        $date_info = $day['date_info'];
        echo "<tr class=\"subheader\"><td colspan=3>". $date_info['day'] ." - ". $date_info['fdate'] ."</td></tr>\n";
        
        foreach ($day['entries'] as $entry) {
            if ($entry['stime'] != $entry['etime']) {
                echo "<tr>\n<td>";
                if ($entry['start_min'] != "00") {
                    echo $entry['stime']." - ";
                } else {
                    echo $entry['stime_no_min']." - ";
                }

                if ($entry['end_min'] != "00") {
                    echo $entry['etime'];
                } else {
                    echo $entry['etime_no_min'];
                }
                echo "</td>\n<td>".$entry['host']."</td>\n<td>".$entry['note']."</td>\n";
            }
            
            if ($entry['stime'] == $entry['etime']) {
                echo "<tr class=\"d1\"><td>All Day</td>\n<td>".$entry['host']."</td>\n<td>".$entry['note']."</td></tr>\n";
            }
        }
    }
    
    echo "</table>";
    ?>
    <div class="footnote">**All times listed are in Eastern Standard Time (EST)</div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
