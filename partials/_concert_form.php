<?php
  if ($concert["featured"] == "Yes")
    $featured_concert = "checked";

  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Date</label>
      <div class=\"control\">
        <input type=\"text\" name=\"date\" maxlength=\"25\" class=\"date\" placeholder=\"YYYY/MM/DD\" value=\"".$concert["date"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Artist</label>
      <div class=\"control\">
      <input type=\"text\" name=\"artist\" maxlength=\"50\" class=\"input-l\" value=\"".$concert["artist"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Band Pic Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"band_pic_url\" maxlength=\"120\" class=\"input-xl\" value=\"".$concert["band_pic_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Band Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"band_url\" maxlength=\"120\" class=\"input-xl\" value=\"".$concert["band_url"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Venue</label>
      <div class=\"control\">
      <input type=\"text\" name=\"venue\" maxlength=\"60\" class=\"input-l\" value=\"".$concert["venue"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Ticket Info</label>
      <div class=\"control\">
      <input type=\"text\" name=\"ticketinfo\" maxlength=\"50\" class=\"input-l\" value=\"".$concert["ticketinfo"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">Ticket Url</label>
      <div class=\"control\">
        <input type=\"text\" name=\"ticketurl\" maxlength=\"120\" class=\"input-xl\" value=\"".$concert["ticketurl"]."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label>Feature Concert</label>
      <div class=\"control\">
      <input type=\"checkbox\" name=\"featured\" value=\"Yes\" ".$featured_concert.">
      </div>
    </div>
        <div class=\"form-actions\">";
      if ($concert['venue'] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Concert\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Concert\">";
      }
    echo "</div>
  </fieldset>";
?>
