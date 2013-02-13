<?php

function add_schedule($host, $date , $start_time, $end_time, $note) {
  $host = mysql_real_escape_string($host);
  $date = mysql_real_escape_string($date);
  $start_time = mysql_real_escape_string($start_time);
  $end_time = mysql_real_escape_string($end_time);
  $note = mysql_real_escape_string($note);

  if (($timestamp = strtotime($date)) !== false) {
    $day_insert = date("l", $timestamp);
    $insert = "INSERT INTO schedule VALUES (id, '".$date. "', '".$day_insert. "', '". $start_time ."', '". $end_time ."', '". $host ."', '". $note ."', 'n')";
    $result = mysql_query($insert);
  } else {
    echo 'invalid timestamp!';
  }

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3>New Schedule for ". $host ." on " .$date . " has been saved</h3>".
    "<hr width=75%>";
    display_schedule(get_schedule(mysql_insert_id()));
    "</div>";
}

function copy_day($new_date, $original_date){
  $insert = "INSERT INTO schedule (date, day, start_time, end_time, host, note, deleted) (SELECT \"".$new_date."\", day, start_time, end_time, host, note, deleted FROM schedule WHERE date = \"".$original_date. "\")";

  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>The Full Day has been Copied.</h1></center>";
}

function delete_schedule($id){
  $update = "UPDATE schedule SET deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo "'Error deleting the schedule from the database: ". $update ."<br>";
  } else {
    $schedule = get_schedule($id);
    echo "<div class=\"center\"><h1>Success!</h1>".
    "<h3><span class=\"success\">". $schedule['host'] ." on ".  $schedule['date'] ."</span> has been deleted.</h3></div>";
  }
}

function display_day($date) {
  $day_query = "SELECT id, date, DATE_FORMAT(date, '%m/%d/%y' ) as fdate, day, host, note, start_time, TIME_FORMAT(start_time, '%l:%i%p' ) as stime, TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, TIME_FORMAT(start_time, '%i' ) as start_min, TIME_FORMAT(end_time, '%l:%i%p' ) as etime, TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, TIME_FORMAT(end_time, '%i' ) as end_min FROM schedule WHERE date ='". $date."' ORDER BY start_time";
  $day_result = mysql_query($day_query);

  if (!$day_result) {
    die('Error finding data in database.');
  }
  $info = mysql_fetch_assoc($day_result);
  echo '<center><h3>Copy This Day: '.$info['fdate'].'</h3></center><p>';
  //reset data collection back to 0
  mysql_data_seek( $day_result, 0 );

  echo "<table id=\"edit_schedule\">\n".
    "<tr><th width=125px>Time</th><th>Host</th><th>Notes</th></tr>\n";

  for ($i=1; $i<=mysql_num_rows($day_result);$i++)
  {			
    $day_info = mysql_fetch_assoc($day_result);
    if ($day_info['stime'] != $day_info['etime'] )
    {
      if (fmod($row,2) == 1) {	
        echo "<tr class=\"d0\">\n";
      } else {
        echo "<tr class=\"d1\">\n";
      }	
      echo "<td>";
      if ($day_info['start_min'] != "00") {
        echo $day_info['stime']." - ";
      } else {
        echo $day_info['stime_no_min']." - ";
      }

      if ($day_info['end_min'] != "00") {
        echo $day_info['etime'];
      } else {
        echo $day_info['etime_no_min'];
      }
      echo "</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td>\n";
      $row = $row + 1;
    }
    if ( $day_info['stime'] == $day_info['etime'] ) {
      echo "<tr class=\"d1\"><td>All Day</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td>\n";

      $row = $row + 1;
    }
  }
  echo "</table>";
  echo '<center><form action="copyday.php" method="post">
    <table id="copy_schedule" border="0">
    <tr>
    <td>New Date:</td>
    <td><input type="text" name="new_date" maxlength="25" size="25"></td>
    <td>Format: yyyy-mm-dd</td>
    </tr>
    <tr><td colspan="2">
    <input type="hidden" name="action" value="write">
    <input type="hidden" name="original_date" value="'.$info['date'].'">
    <input type="submit" value="Copy Full Day"></td></tr>
    </table>
    </form></center>';

}

function display_schedule($schedule) {
    echo "<br><b>Host:</b> ". $schedule['host'].
    "<br><b>Date:</b> ". $schedule['date'].
    "<br><b>Day:</b> " . $schedule['day'].
    "<br><b>Start Time:</b> ". $schedule['start_time'].
    "<br><b>End Time:</b> ". $schedule['end_time'].
    "<br><b>Note:</b> ". $schedule['note'];
}

function display_all_schedules(){
  $row = 1;
  $date_query = "SELECT date, day, DATE_FORMAT(date, '%m/%d/%y' ) as fdate FROM schedule WHERE deleted = 'n' AND date >= date(now()) GROUP BY date, day ORDER BY date LIMIT 7";
  $date_result = mysql_query($date_query);

  $day_query = "SELECT id, date, DATE_FORMAT(date, '%m/%d/%y' ) as fdate, day, host, note, start_time, TIME_FORMAT(start_time, '%l:%i%p' ) as stime, TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, TIME_FORMAT(start_time, '%i' ) as start_min, TIME_FORMAT(end_time, '%l:%i%p' ) as etime, TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, TIME_FORMAT(end_time, '%i' ) as end_min FROM schedule WHERE deleted = 'n' AND  date >= date(now()) ORDER BY date, start_time";
  $day_result = mysql_query($day_query);

  if (!$date_result || !$day_result) {
    die('No results in database.');
  }

  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
    "<thead><tr><th width=130px>Time</th><th>Host</th><th>Notes</th></thead></tr>\n";

  for ($i=1; $i<=mysql_num_rows($date_result);$i++)
  {
    $date_info = mysql_fetch_assoc($date_result);
    echo "<tr class=\"subheader\"><td colspan=3>". $date_info['day'] ." - ". $date_info['fdate'] ."</td></tr>\n";
    for ($j=1; $j<=mysql_num_rows($day_result);$j++)
    {
      $day_info = mysql_fetch_assoc($day_result);
      if ($date_info['day'] == $day_info['day'])

        if (($day_info['date'] == $date_info['date'] ) && $day_info['stime'] != $day_info['etime'] )
        {
          echo "<tr>\n<td>";
          if ($day_info['start_min'] != "00") {
            echo $day_info['stime']." - ";
          } else {
            echo $day_info['stime_no_min']." - ";
          }

          if ($day_info['end_min'] != "00") {
            echo $day_info['etime'];
          } else {
            echo $day_info['etime_no_min'];
          }
          echo "</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td>\n";

          $row = $row + 1;
        }
      if (($date_info['date'] == $day_info['date']) && $day_info['stime'] == $day_info['etime'] ) {
        echo "<tr class=\"d1\"><td>All Day</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td></tr>\n";
        $row = $row + 1;
      }
    }

    mysql_data_seek( $day_result, 0 );
  }
  echo "</table>";	
}

function get_schedule($id) {
  $query = "SELECT * FROM schedule where id=".$id;
  $result = mysql_query($query);

  if (!$result)
    echo 'No results in database.';
  else
    return mysql_fetch_assoc($result);
}

function update_schedule($id, $host, $date, $start_time, $end_time, $note){
  $id = mysql_real_escape_string($id);
  $date = mysql_real_escape_string($date);
  $start_time = mysql_real_escape_string($start_time);
  $end_time = mysql_real_escape_string($end_time);
  $note = mysql_real_escape_string($note);

  if (($timestamp = strtotime($date)) !== false) {
    $day_insert = date("l", $timestamp);
    $update = "UPDATE schedule SET date=\"$date\", day=\"$day_insert\", start_time=\"$start_time\", end_time=\"$end_time\", host=\"$host\", note=\"$note\" WHERE id=".$id;
    $result = mysql_query($update);
  } else {
    echo 'invalid timestamp!';
  }

  if (!$result)
    echo "There was an error updating: <br>" . $update;
  else
    return $result;
}

function view_all_schedules() {
  $date_query = "SELECT date, day, DATE_FORMAT(date, '%m/%d/%y' ) as fdate FROM schedule WHERE deleted = 'n' AND date >= date(now()) GROUP BY date, day ORDER BY date";
  $date_result = mysql_query($date_query);

  $day_query = "SELECT id, date, DATE_FORMAT(date, '%m/%d/%y' ) as fdate, day, host, note, start_time, TIME_FORMAT(start_time, '%l:%i%p' ) as stime, TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, TIME_FORMAT(start_time, '%i' ) as start_min, TIME_FORMAT(end_time, '%l:%i%p' ) as etime, TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, TIME_FORMAT(end_time, '%i' ) as end_min FROM schedule WHERE deleted = 'n' AND  date >= date(now()) ORDER BY date, start_time";
  $day_result = mysql_query($day_query);

  if (!$date_result || !$day_result)
    die('No results in database.');

  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
    "<thead><th width=125px>Time</th><th>Host</th><th>Notes</th><th colspan=3><center>Actions</center></th></thead>\n";

  for ($i=1; $i<=mysql_num_rows($date_result);$i++) {
    $date_info = mysql_fetch_assoc($date_result);
    echo "<tr class=\"subheader\"><td colspan=3>". $date_info['day'] ." - ". $date_info['fdate'] ."</td>\n".
      "<td colspan=3><div class=\"center\"><a href=\"copyday.php?date=". $date_info['date'] ."\">Copy Full Day</a><div></td></tr>\n";
    for ($j=1; $j<=mysql_num_rows($day_result);$j++) {
      $day_info = mysql_fetch_assoc($day_result);
      if ($date_info['day'] == $day_info['day'])	 			
        if (($day_info['date'] == $date_info['date'] ) && $day_info['stime'] != $day_info['etime'] ) {
          echo "<tr>\n<td>";
          if ($day_info['start_min'] != "00")
            echo $day_info['stime']." - ";
          else
            echo $day_info['stime_no_min']." - ";

          if ($day_info['end_min'] != "00")
            echo $day_info['etime'];
          else
            echo $day_info['etime_no_min'];

          echo "</td>\n<td>".$day_info['host']."</td>
            <td>".$day_info['note']."</td>
            <td><a href=\"schedule_update.php?id=".$day_info['id']."\">Edit</a></td><td><a href=\"schedule_delete.php?id=".$day_info['id']."\">Delete</a></td><td><a href=\"schedule_update.php?action=copy&id=".$day_info['id']."\">Copy</a></td></tr>\n";

          $row = $row + 1;
        }
      if (($date_info['date'] == $day_info['date']) && $day_info['stime'] == $day_info['etime'] ) {
        echo "<tr><td>All Day</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td>\n";
        echo "<td><a href=\"schedule_update.php?id=".$day_info['id']."\">Edit</a></td><td><a href=\"schedule_delete.php?id=".$day_info['id']."\">Delete</a></td><td><a href=\"schedule_update.php?action=copy&id=".$day_info['id']."\">Copy</a></td></tr>\n";

        $row = $row + 1;
      }
    }

    mysql_data_seek( $day_result, 0 );
  }
  echo "</table>";
}

?>
