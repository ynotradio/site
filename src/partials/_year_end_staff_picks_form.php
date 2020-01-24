<?php
if ($year_end_staff_pick['html'] == '') {
    $order_id = get_year_end_staff_pick_count() + 1;
    $html = "<table class=\"year_end_staff_pick\">
  <tr>
    <td colspan=\"2\" class=\"bottom-spacer_20\">
      <div style=\"float: left;\">
        <strong>NAME HERE<br>
        <em>SHOW NAME</em></strong>
      </div>
      <div style=\"float: right;\">
        <strong>TIME FRAME</strong>
      </div>
    </td>
  </tr>
  <tr>
    <td width=\"50%\">
      <h3><u>Top 10 Albums</u></h3>
      <ol>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
        <li>BAND - <em>ALBUM</em></li>
      </ol>
    </td>
    <td width=\"50%\">
      <h3><u>Top 20 Songs</u></h3>
      <ol>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
        <li>BAND - <em>SONG</em></li>
      </ol>
    </td>
  </tr>
</table>";
  } else {
    $order_id = $year_end_staff_pick["order_id"];
    $html = $year_end_staff_pick["html"];
  }

  echo"<fieldset>
    <div class=\"control-group\">
      <label class=\"required\">Order</label>
      <div class=\"control\">
      <input type=\"text\" name=\"order\" class=\"input-s\" value=\"".$order_id."\">
      </div>
    </div>
    <div class=\"control-group\">
      <label class=\"required\">HTML</label>
      <div class=\"control\">
        <textarea name=\"html\" rows=\"45\" class=\"input-xl\">".$html."</textarea>
      </div>
    </div>
    <div class=\"form-actions\">";
      if ($year_end_staff_pick["html"] == ''){
        echo "<input type=\"hidden\" name=\"action\" value=\"insert\">
        <input type=\"submit\" class=\"btn-success\" value=\"Add Year End Staff Pick\">";
      } else {
        echo "<input type=\"hidden\" name=\"action\" value=\"update\">
          <input type=\"submit\" class=\"btn-info\" value=\"Update Year End Staff Pick\">";
      }
    echo "</div>
  </fieldset>";
?>
