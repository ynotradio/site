<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Title</label>
      <div class=\"control\">
      <input type=\"text\" name=\"title\" class=\"input-xl\" value=\"".$custom_text["title"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Copy</label>
      <div class=\"control\">
        <textarea name=\"html\" rows=\"20\" class=\"input-xl\">".$custom_text["html"]."</textarea>      
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($custom_text["title"] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Custom Text\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Custom Text\">";
      }
    echo "</div>
  </fieldset>";
?>
