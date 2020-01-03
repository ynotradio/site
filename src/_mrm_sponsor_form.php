<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Match ID</label>
      <div class=\"control\">
      <input type=\"text\" readonly name=\"match\" class=\"input-l\" value=\"".$mrm_sponsor["id"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Sponsor Name</label>
      <div class=\"control\">
      <input type=\"text\" name=\"sponsor\" class=\"input-l\" value=\"".$mrm_sponsor["sponsor"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Sponsor Message</label>
      <div class=\"control\">
      <textarea type=\"textarea\" name=\"sponsor_msg\" class=\"input-xl\">" . $mrm_sponsor["sponsor_msg"] . "</textarea>
      </div>
    </div>
    
    <div class=\"form-actions\">\n
    <input type=\"hidden\" name=\"action\" value=\"update\">\n
    <input type=\"submit\" class=\"btn-info\" value=\"Update Modern Rock Madness Sponsor\">\n
    </div>\n
  </fieldset>";
?>
