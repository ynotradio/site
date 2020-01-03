<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Name</label>
      <div class=\"control\">
      <input type=\"text\" name=\"name\" class=\"input-l\" value=\"".$deejay["name"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Email</label>
      <div class=\"control\">
      <input type=\"text\" name=\"email\" class=\"input-l\" value=\"".$deejay["email"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Show</label>
      <div class=\"control\">
      <input type=\"text\" name=\"show\" class=\"input-l\" value=\"".$deejay["show"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Social Text</label>
      <div class=\"control\">
      <input type=\"text\" name=\"external_connect_text\" class=\"input-l\" value=\"".$deejay["external_connect_text"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Social Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"external_connect_url\" class=\"input-xl\" value=\"".$deejay["external_connect_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Picture</label>
      <div class=\"control\">
        <input type=\"text\" name=\"pic\" class=\"input-xl\" value=\"".$deejay["pic"]."\">
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($deejay['name'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Deejay\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Deejay\">";
      }
    echo "</div>
  </fieldset>";
?>
