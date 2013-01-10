<?php

$page_file = "aboutus.php";
$page_title = "About Us";

require ("ext/main_fns.php");
require ("ext/header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>About Us</h1>
    <h3>We're Still Alive!</h3>
    Hello friends! Thank you for your outpouring of support over the last few weeks, especially during my show last Thursday. You all told me how much you'd miss me and the other DJs who were leaving; you said that you knew it was the people who made that station what it was, and that you'd love to hear us start up again somewhere else soon. Well, soon is now and somewhere else is here - the all new Y-Not Radio! The name has changed but our mission remains the same as it always has, whether we've been in a professional radio station or a DIY Bunker studio, to bring you the best alternative, modern, and indie rock! We've had our share of obstacles recently, but they have only made us a stronger, more unified team who will do whatever it takes to share in the joy of music with you. Thank you for finding us here, thank you for sticking with the people rather than the name, and thank you for listening! We hope that you enjoy Y-Not Radio, and please please please tell your friends!
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>

