<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Headline</label>
      <div class=\"control\">
      <input type=\"text\" name=\"headline\" class=\"input-l\" value=\"".$story["headline"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Story</label>
      <div class=\"control\">
        <textarea name=\"story\" rows=\"10\" class=\"input-xl\">".$story["story"]."</textarea>
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Start Date</label>
      <div class=\"control\">
      <input type=\"text\" name=\"start_date\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$story["start_date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">End Date</label>
      <div class=\"control\">
      <input type=\"text\" name=\"end_date\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$story["end_date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Picture</label>
      <div class=\"control\">
      <input type=\"text\" name=\"pic\" class=\"input-xl\" value=\"".$story["pic"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Pic Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"pic_url\" class=\"input-xl\" value=\"".$story["pic_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Priority</label>
      <div class=\"control\">
        <input type=\"text\" name=\"priority\" class=\"input-s\" value=\"".$story["priority"]."\">
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($story['headline'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Story\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Story\">";
      }
    echo "</div>
  </fieldset>";
?>
