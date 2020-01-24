<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Date</label>
      <div class=\"control\">
      <input type=\"text\" name=\"date\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$music["date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Artist</label>
      <div class=\"control\">
      <input type=\"text\" name=\"artist\" class=\"input-l\" value=\"".$music["artist"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Song</label>
      <div class=\"control\">
      <input type=\"text\" name=\"song\" class=\"input-l\" value=\"".$music["song"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Song Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"url\" class=\"input-xl\" value=\"".$music["url"]."\">
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($music['artist'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Music\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Music\">";
      }
    echo "</div>
  </fieldset>";
?>
