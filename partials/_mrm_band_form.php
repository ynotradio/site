<?php
  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Name</label>
      <div class=\"control\">
      <input type=\"text\" name=\"name\" class=\"input-l\" value=\"".$mrm_band["name"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Abbr (7)</label>
      <div class=\"control\">
      <input type=\"text\" name=\"abbr\" class=\"input-s\" value=\"".$mrm_band["abbr"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Url</label>
      <div class=\"control\">
      <input type=\"text\" name=\"url\" class=\"input-xl\" value=\"".$mrm_band["url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Seed</label>
      <div class=\"control\">
      <input type=\"text\" name=\"seed\" class=\"input-s\" value=\"".$mrm_band["seed"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Picture</label>
      <div class=\"control\">
      <input type=\"text\" name=\"pic_url\" class=\"input-xl\" value=\"".$mrm_band["pic_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Placement</label>
      <div class=\"control\">
      <input type=\"text\" name=\"placement\" class=\"input-s\" value=\"".$mrm_band["placement"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Sponsor</label>
      <div class=\"control\">
      <input type=\"text\" name=\"sponsor\" class=\"input-l\" value=\"".$mrm_band["sponsor"]."\">
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($mrm_band['name'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Modern Rock Madness Band\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Modern Rock Madness Band\">";
      }
    echo "</div>
  </fieldset>";
?>
