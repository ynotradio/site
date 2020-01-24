<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Artist</label>
      <div class=\"control\">
      <input type=\"text\" name=\"artist\" class=\"input-l\" value=\"".$top11_song["artist"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Song</label>
      <div class=\"control\">
      <input type=\"text\" name=\"song\" class=\"input-l\" value=\"".$top11_song["song"]."\">
      </div>
    <div class=\"form-actions\">";
      if ($top11_song['artist'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Top 11 Song\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Top 11 Song\">";
      }
    echo "</div>
  </fieldset>";
?>
