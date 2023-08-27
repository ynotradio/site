<?php

$page_file = "aboutus.php";
$page_title = "About Us";

require ("functions/main_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>About Us</h1>
    <b>Y-Not Radio</b> is the home of indie rock in Philadelphia.  Our roots go back to Philly's long-running alternative FM station <b>Y100</b> (WPLY), where a new music show called Y-Not aired every sunday night from 1997 through the station's end in 2005.  After the demise of Y100, program director <b>Jim McGuinn</b>, promotions director <b>Josh T. Landow</b>, and host <b>Joey O.</b> (amongst others) kept the spirit of the station alive online as <b>Y100 Rocks</b> (later <b>Y-Rock</b>).  As of 2010, the station returned to its independent roots, morphing once again into Y-Not Radio with Landow at the helm.  Through all the name changes, our mission has always remained the same: to bring you the best alternative, modern, and indie rock!
    <p>
    Thank you for finding us, thank you for listening, and thank you for your support! We hope that you enjoy Y-Not Radio!
    <div class="center">
      <a href="contact.php"><h3>Contact Us</h3></a>
      <a href="deejays.php"><h3>Y-Not Radio Staff</h3></a>
      <a href="donate.php"><h3>Support Y-Not Radio</h3></a>
      <a href="mobile.php"><h3>Get The Y-Not Radio Mobile App</h3></a>
      <a href="ymail.php"><h3>Subscribe To Y-Not's Newsletter</h3></a>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>

