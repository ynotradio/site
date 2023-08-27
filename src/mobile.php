<?php

$page_file = "mobile.php";
$page_title = "Mobile";

require ("functions/main_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Mobile</h1>
    <div class="clearfix">
      <img src="https://i.imgur.com/VUuVmLd.jpg" alt="iRadioPhilly" width="150px" align="left" style="margin-right: 10px;">
      <p>Take your indie on the go with the Y-Not Radio mobile app for <strong><a href="https://apps.apple.com/app/y-not-radio/id6443588275">iOS</a></strong> or <strong><a href="https://play.google.com/store/apps/details?id=com.live365.ynotradio&pli=1">Android</a></strong>.</p>
      
      <p class="top-spacer_20">For other devices, Y-Not Radio is also available through the TuneIn Radio app. Find your device and download the app <a href="https://tunein.com/get-tunein/">here</a>. After downloading and launching the TuneIn Radio, search for Y-Not Radio (spelling counts) and then make us a preset for easy access every time.</p>
    
      <p class="top-spacer_20">You can now also listen on Alexa devices by enabling the Y-Not Radio skill on the device and then saying, "Alexa, play Y-Not Radio."</p>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
