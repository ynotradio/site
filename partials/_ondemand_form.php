<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Headline</label>
      <div class=\"control\">
      <input type=\"text\" name=\"headline\" class=\"input-xl\" value=\"".$ondemand["headline"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Songs</label>
      <div class=\"control\">
      <input type=\"text\" name=\"songs\" class=\"input-xl\" value=\"".$ondemand["songs"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Note</label>
      <div class=\"control\">
      <input type=\"text\" name=\"note\" class=\"input-xl\" value=\"".$ondemand["note"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Image Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"image\" class=\"input-xl\" value=\"".$ondemand["image"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Audio ID</label>
      <div class=\"control\">
        <input type=\"text\" name=\"audio_id\" class=\"input-xl\" value=\"".$ondemand["audio_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Recorded</label>
      <div class=\"control\">
      <input type=\"text\" name=\"date\" placeholder=\"YYYY/MM/DD\" class=\"date\" value=\"".$ondemand["date"]."\">
      </div>
    </div>    
    <div class=\"form-actions\">";
      if ($ondemand['headline'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add On Demand\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update On Demand\">";
      }
    echo "</div>
  </fieldset>";
?>
