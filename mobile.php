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
      <img src="imgs/ynot_on_i_radio_philly.jpg" alt="iRadioPhilly" width="150px" align="left" style="margin-right: 10px;">
      Listen to Y-Not Radio on the go with the <b>iRadioPhilly</b> app for iOS devices (iPhone, iPad, iPod) and Android.  Get it from the <a href="http://itunes.apple.com/us/app/iradiophilly/id428128166?mt=8" target="_new">iTunes App Store</a> or <a href="https://market.android.com/details?id=com.internetradiopartners.iradiophilly" target="_new">Android Market</a>.  Then just find Y-Not Radio in the list of iRadioPhilly's 20 stations.  Once you're in the app, tap the arrow in the upper right corner to see the last 10 songs played.
    </div>
    <div class="top-spacer_20">
      <a href="http://tunein.com/mobile/" target="_blank"><img src="images/tunein_radio_logo.jpg" alt="TuneIn Radio" width="150px" align="right" style="margin-left: 10px;"></a>
      If you're a Blackberry, Windows Phone, or Palm user, Y-Not Radio is also available through the free TuneIn Radio app. Find your phone and download the app <a href="http://tunein.com/mobile/">here</a>. After downloading and launching the TuneIn Radio, search for Y-Not Radio (spelling counts) and then make us a preset for easy access every time.
    </div>
    <div class="footnote">
      *As with any streaming media, charges may be applied from your mobile phone provider depending on your data plan.
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
