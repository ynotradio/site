<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Host</label>
      <div class=\"control\">
        <input type=\"text\" name=\"host\" class=\"inputl\" value=\"". $schedule["host"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Date</label>
      <div class=\"control\">
        <input type=\"text\" name=\"date\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$schedule["date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Start Time</label>
      <div class=\"control\">
      <input type=\"text\" name=\"start_time\"  placeholder=\"00:00:00\" class=\"time\" value=\"".$schedule["start_time"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">End Time</label>
      <div class=\"control\">
      <input type=\"text\" name=\"end_time\"  placeholder=\"00:00:00\" class=\"time\" value=\"".$schedule["end_time"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Notes</label>
      <div class=\"control\">
        <textarea name=\"note\" cols=\"40\" rows=\"5\">". $schedule["note"]."</textarea>
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($schedule['host'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Schedule\">";
      } elseif ($action == "copy") {
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
          <input type=\"submit\" class=\"btn-inverse\" value=\"Copy Schedule\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Schedule\">";
      }
    echo "</div>
  </fieldset>";
?>
