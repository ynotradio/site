<?php
  if ($ad['name'] == '')
    $pic_url = $target;
  else
    $pic_url = $ad["pic_url"];

  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Name</label>
      <div class=\"control\">
      <input type=\"text\" name=\"name\" maxlength=\"55\" class=\"input-l\" value=\"".$ad["name"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Start Date</label>
      <div class=\"control\">
        <input type=\"text\" name=\"start_date\" maxlength=\"25\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$ad["start_date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">End Date</label>
      <div class=\"control\">
        <input type=\"text\" name=\"end_date\" maxlength=\"25\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$ad["end_date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Picture Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"pic_url\" maxlength=\"120\" class=\"input-xl\" value=\"".$pic_url."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Link Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"web_url\" maxlength=\"120\" class=\"input-xl\" value=\"".$ad["web_url"]."\">
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($ad['name'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
              <input type=\"submit\" class=\"btn-success\" value=\"Add Ad\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
              <input type=\"submit\" class=\"btn-info\" value=\"Update Ad\">";
      }
    echo "</div>
  </fieldset>";
?>
