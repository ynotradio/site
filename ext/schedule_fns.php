<?php

function display_schedule(){
  $row = 1;
  $date_query = "SELECT date, day, DATE_FORMAT(date, '%m/%d/%y' ) as fdate FROM schedule WHERE deleted = 'n' AND date >= date(now()) GROUP BY date, day ORDER BY date LIMIT 7";
  $date_result = mysql_query($date_query);

  $day_query = "SELECT id, date, DATE_FORMAT(date, '%m/%d/%y' ) as fdate, day, host, note, start_time, TIME_FORMAT(start_time, '%l:%i%p' ) as stime, TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, TIME_FORMAT(start_time, '%i' ) as start_min, TIME_FORMAT(end_time, '%l:%i%p' ) as etime, TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, TIME_FORMAT(end_time, '%i' ) as end_min FROM schedule WHERE deleted = 'n' AND  date >= date(now()) ORDER BY date, start_time";
  $day_result = mysql_query($day_query);

  if (!$date_result || !$day_result) {
    die('No results in database.');
  }

  echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">\n".
    "<thead><tr><th width=125px>Time</th><th>Host</th><th>Notes</th></thead></tr>\n";

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

function addschedule($date, $day, $start_time, $end_time, $host, $note) {
  $date = mysql_real_escape_string($date);
  $start_time = mysql_real_escape_string($start_time);
  $end_time = mysql_real_escape_string($end_time);
  $host = mysql_real_escape_string($host);
  $note = mysql_real_escape_string($note);

  $insert = "INSERT INTO schedule VALUES (id, '".$date. "', '".$day. "', '". $start_time ."', '". $end_time ."', '". $host ."', '". $note ."', 'n')";
  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p>".
    "<br><hr width=75%>".
    "<br><b>Date:</b> ". $date.
    "<br><b>Day:</b> ". $day.
    "<br><b>Start Time:</b> ". $start_time.
    "<br><b>End Time:</b> ". $end_time.
    "<br><b>Host:</b> ". $host.
    '<br><b>Note:</b>'. $note.
    "<p>";
}

function vs (){
  $date_query = "SELECT date, day, DATE_FORMAT(date, '%m/%d/%y' ) as fdate FROM schedule WHERE deleted = 'n' AND date >= date(now()) GROUP BY date, day ORDER BY date";
  $date_result = mysql_query($date_query);

  $day_query = "SELECT id, date, DATE_FORMAT(date, '%m/%d/%y' ) as fdate, day, host, note, start_time, TIME_FORMAT(start_time, '%l:%i%p' ) as stime, TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, TIME_FORMAT(start_time, '%i' ) as start_min, TIME_FORMAT(end_time, '%l:%i%p' ) as etime, TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, TIME_FORMAT(end_time, '%i' ) as end_min FROM schedule WHERE deleted = 'n' AND  date >= date(now()) ORDER BY date, start_time";
  $day_result = mysql_query($day_query);

  if (!$date_result || !$day_result) {
    die('No results in database.');
  }

  echo "<table id=\"edit_schedule\">\n".
    "<tr><th width=125px>Time</th><th>Host</th><th>Notes</th><th colspan=3><center>Actions</center></th></tr>\n";

  for ($i=1; $i<=mysql_num_rows($date_result);$i++)
  {
    $date_info = mysql_fetch_assoc($date_result);
    echo "<tr id=\"full\"><td colspan=3>". $date_info['day'] ." - ". $date_info['fdate'] ."</td>\n".
      "<td colspan=3><center><a href=\"copyday.php?date=". $date_info['date'] ."\">Copy Full Day</a></center></td></tr>\n";
    for ($j=1; $j<=mysql_num_rows($day_result);$j++)
    {
      $day_info = mysql_fetch_assoc($day_result);
      if ($date_info['day'] == $day_info['day'])	 			
        if (($day_info['date'] == $date_info['date'] ) && $day_info['stime'] != $day_info['etime'] )
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
          echo "<td><a href=\"editschedule.php?id=".$day_info['id']."\">Edit</a></td><td><a href=\"deleteschedule.php?id=".$day_info['id']."\">Delete</a></td><td><a href=\"copyschedule.php?id=".$day_info['id']."\">Copy</a></td></tr>\n";

          $row = $row + 1;
        }
      if (($date_info['date'] == $day_info['date']) && $day_info['stime'] == $day_info['etime'] ) {
        echo "<tr class=\"d1\"><td>All Day</td>\n<td>".$day_info['host']."</td>\n<td>".$day_info['note']."</td>\n";
        echo "<td><a href=\"editschedule.php?id=".$day_info['id']."\">Edit</a></td><td><a href=\"deleteschedule.php?id=".$day_info['id']."\">Delete</a></td><td><a href=\"copyschedule.php?id=".$day_info['id']."\">Copy</a></td></tr>\n";

        $row = $row + 1;
      }
    }

    mysql_data_seek( $day_result, 0 );
  }
  echo "</table>";	
}

function editschedule($id) {
  $days = array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");

  $query = "SELECT * FROM schedule where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Edit Schedule:</h3></center><p>';


  echo '<form action="saveschedule.php?id='.$info["id"].'" method="post">
    <table id="edit_schedule" border="0">
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Day:</td>
    <td colsplan="2"><select name="day">';
  foreach ($days as $key=>$value) {
    if ($value == $info["day"]) {
      echo '<option value="'. $value. '" selected >'.$value.'</option>';
    } else {
      echo '<option value="'. $value. '">'.$value.'</option>';
    }
  }
  echo '</select>
    </tr>
    </tr>
    <tr>
    <td>Start Time:</td>
    <td><input type="text" value="'.$info["start_time"].'" name="start_time" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>End Time:</td>
    <td><input type="text" value="'.$info["end_time"].'" name="end_time" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Host:</td>
    <td><input type="text" value="'.$info["host"].'" name="host" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Note:</td>
    <td><textarea name="note" cols=40 rows=10>'.$info["note"].'</textarea></td>
    </tr>
    <tr><td colspan="2">
    <input type="submit" value="Save Schedule"></td></tr>
    </table>
    </form>';
}


function copyschedule($id) {
  $days = array("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");

  $query = "SELECT * FROM schedule where id=".$id;
  $result = mysql_query($query);

  if (!$result) {
    die('No results in database.');
  }
  $info = mysql_fetch_assoc($result);
  echo '<center><h3>Copy Schedule:</h3></center><p>';

  echo '<form action="addschedule.php" method="post">
    <table id="edit_schedule" border="0">
    <tr>
    <td>Date:</td>
    <td><input type="text" value="'.$info["date"].'" name="date" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Day:</td>
    <td colsplan="2"><select name="day">';
  foreach ($days as $key=>$value) {
    if ($value == $info["day"]) {
      echo '<option value="'. $value. '" selected >'.$value.'</option>';
    } else {
      echo '<option value="'. $value. '">'.$value.'</option>';
    }
  }

  echo '</select>
    </tr>
    <tr>
    <td>Start Time:</td>
    <td><input type="text" value="'.$info["start_time"].'" name="start_time" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>End Time:</td>
    <td><input type="text" value="'.$info["end_time"].'" name="end_time" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Host:</td>
    <td><input type="text" value="'.$info["host"].'" name="host" maxlength="50" size="50"></td>
    </tr>
    <tr>
    <td>Note:</td>
    <td><textarea name="note" cols=40 rows=10>'.$info["note"].'</textarea></td>
    </tr>
    <tr><td colspan="2">
    <input type="hidden" name="action" value="write">
    <input type="submit" value="Copy Schedule"></td></tr>
    </table>
    </form>';
}

function saveschedule($id, $date, $day, $start_time, $end_time, $host, $note){
    $id = mysql_real_escape_string($id);
    $date = mysql_real_escape_string($date);
    $start_time = mysql_real_escape_string($start_time);
    $end_time = mysql_real_escape_string($end_time);
    $host = mysql_real_escape_string($host);
    $note = mysql_real_escape_string($note);

  $update = "UPDATE schedule SET date=\"$date\", day=\"$day\", start_time=\"$start_time\", end_time=\"$end_time\", host=\"$host\", note=\"$note\" WHERE id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }
}

function deleteschedule($id){
  $update = "UPDATE schedule SET deleted ='y' where id=".$id;
  $result = mysql_query($update);

  if (!$result) {
    echo $update ."<br>";
    die('Error Updating Database.');
  }

  echo "<center><h1>Success!</h1>".
    "<p><h3>The Schedule entry has been deleted.</h3></center><p>";
}

function displayday($date) {
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

function copyday($new_date, $original_date){
  $insert = "INSERT INTO schedule (date, day, start_time, end_time, host, note, deleted) (SELECT \"".$new_date."\", day, start_time, end_time, host, note, deleted FROM schedule WHERE date = \"".$original_date. "\")";

  $result = mysql_query($insert);

  if (!$result) {
    echo $insert ."<br>";
    die('Error Inserting into Database.');
  }

  echo "<center><h1>The Full Day has been Copied.</h1></center>";
}

?>

