<?php

$page_file = "ymail.php";
$page_title = "Y-Mail";

require ("functions/main_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Y-Not Radio Weekly e-Newsletter</h1>
    <div class="bottom-spacer_20">Sign up for Y-Not Radio's weekly e-mail newsletter, or Y-Mail as we like to call it. Then you'll have all of our programming information as well as news on upcoming concerts, album reviews, ticket giveaways, and more delivered right to you.</div>
    <form method="post" action="http://mailblast.vazoom.com/index.php?c=front&amp;m=subscribe&amp;jump=true" id="subscribeForm" class="form-default inline input-seperation">
      <fieldset>
        <div class="control-group">
          <label class="required">Name</label>
          <div class="controls"><input type="text" name="data[name]" class="input-l"></div>
          <label class="required">Email</label>
          <div class="controls"><input type="text" name="data[email_address]" class="input-l"></div>
          <label>Area</label>
          <div class="controls">
            <select name="data[area]" id="area">
              <option value="0">Unknown</option>
            </select>
          </div>
          <label>Birthday</label>
          <div class="controls">
            <select name="send_date_month" id="send_date_month" onchange="javascript:setDays();">
              <option value="01"<?php if (date("m") == 01) echo "selected=\"\"" ?>>January</option>
              <option value="02"<?php if (date("m") == 02) echo "selected=\"\"" ?>>February</option>
              <option value="03"<?php if (date("m") == 03) echo "selected=\"\"" ?>>March</option>
              <option value="04"<?php if (date("m") == 04) echo "selected=\"\"" ?>>April</option>
              <option value="05"<?php if (date("m") == 05) echo "selected=\"\"" ?>>May</option>
              <option value="06"<?php if (date("m") == 06) echo "selected=\"\"" ?>>June</option>
              <option value="07"<?php if (date("m") == 07) echo "selected=\"\"" ?>>July</option>
              <option value="08"<?php if (date("m") == 08) echo "selected=\"\"" ?>>August</option>
              <option value="09"<?php if (date("m") == 09) echo "selected=\"\"" ?>>September</option>
              <option value="10"<?php if (date("m") == 10) echo "selected=\"\"" ?>>October</option>
              <option value="11"<?php if (date("m") == 11) echo "selected=\"\"" ?>>November</option>
              <option value="12"<?php if (date("m") == 12) echo "selected=\"\"" ?>>December</option>
            </select> -
            <select name="send_date_day" id="send_date_day">
                <?php
                for ($day=1; $day <= 31; $day++) {
                  if (date('d') == $day)
                    echo "<option value=\"" . $day . "\" selected=\"\">" . $day . "</option>";
                  else
                    echo "<option value=\"" . $day . "\">" . $day . "</option>";
                }
              ?>
            </select> -
            <select name="send_date_year" id="send_date_year" onchange="javascript:setDays();">
              <?php
                for ($year=1963; $year <= date('Y'); $year++) {
                  if (date('Y') - 25 == $year)
                    echo "<option value=\"" . $year . "\" selected=\"\">" . $year . "</option>";
                  else
                    echo "<option value=\"".$year."\">".$year."</option>";
                }
              ?>
            </select>
          </div>
          <label>Gender</label>
          <div class="controls">
            <select name="data[gender]" id="gender">
              <option></option>
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </div>
          <label>Time Zone</label>
          <div class="controls">
            <select name="data[time_zone]" id="time_zone">
                <option value="-1200">(GMT -12:00) Eniwetok, Kwajalein)</option>
                <option value="-1100">(GMT -11:00) Midway Island, Samoa)</option>
                <option value="-1000">(GMT -10:00) Hawaii)</option>
                <option value="-0900">(GMT -9:00) Alaska)</option>
                <option value="-0800">(GMT -8:00) Pacific Time, Los Angeles, Seattle)</option>
                <option value="-0700">(GMT -7:00) Mountain Time, Denver)</option>
                <option value="-0600">(GMT -6:00) Central Time, Chicago, Mexico City)</option>
                <option value="-0500" selected="">(GMT -5:00) Eastern Time, New York, Bogota, Lima)</option>
                <option value="-0400">(GMT -4:00) Atlantic Time, Caracas, La Paz)</option>
                <option value="-0330">(GMT -3:30) Newfoundland)</option>
                <option value="-0300">(GMT -3:00) Brazil, Buenos Aires, Georgetown)</option>
                <option value="-0200">(GMT -2:00) Mid-Atlantic)</option>
                <option value="-0100">(GMT -1:00 hour) Azores, Cape Verde Islands)</option>
                <option value="+0000">(GMT) Western Europe Time, London, Lisbon, Casablanca)</option>
                <option value="+0100">(GMT +1:00 hour) Brussels, Copenhagen, Madrid, Paris)</option>
                <option value="+0200">(GMT +2:00) Kaliningrad, South Africa)</option>
                <option value="+0300">(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg)</option>
                <option value="+0330">(GMT +3:30) Tehran)</option>
                <option value="+0400">(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi)</option>
                <option value="+0430">(GMT +4:30) Kabul)</option>
                <option value="+0500">(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent)</option>
                <option value="+0530">(GMT +5:30) Bombay, Calcutta, Madras, New Delhi)</option>
                <option value="+0600">(GMT +6:00) Almaty, Dhaka, Colombo)</option>
                <option value="+0700">(GMT +7:00) Bangkok, Hanoi, Jakarta)</option>
                <option value="+0800">(GMT +8:00) Beijing, Perth, Singapore, Hong Kong)</option>
                <option value="+0900">(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk)</option>
                <option value="+0930">(GMT +9:30) Adelaide, Darwin)</option>
                <option value="+1000">(GMT +10:00) Eastern Australia, Guam, Vladivostok)</option>
                <option value="+1100">(GMT +11:00) Magadan, Solomon Islands, New Caledonia)</option>
                <option value="+1200">(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka)</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <input name="uk" value="4YAr3M" type="hidden">
          <input name="action" value="subscribe" type="hidden">
          <input name="category_id" value="14" type="hidden">
          <button class="btn-large btn-success" type="submit" name="Subscribe" id="Subscribe" value="Subscribe" onclick="javascript:return checkForm();">Subscribe</button>
        </div>
      </fieldset>
    </form>
    <a href="http://mailblast.vazoom.com/index.php?c=front&amp;m=changeEmail&amp;uk=4YAr3M" target="_blank">Change Your Email Address</a>
    <br>
    <a href="http://mailblast.vazoom.com/index.php?c=front&amp;m=unsubscribe&amp;uk=4YAr3M" target="_blank">Unsubscription</a>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
