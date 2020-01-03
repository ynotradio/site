<?php

$page_file = "contact.php";
$page_title = "Contact Us";

require ("functions/main_fns.php");
require ("partials/_header.php");

$action = "fill_out";
if ($_POST['action'])
  $action = $_POST['action'];

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
  <h1>Drop us a line!</h1>
  <?php if ($action == "fill_out") {
    $ipi = getenv("REMOTE_ADDR");
    $httprefi = getenv ("HTTP_REFERER");
    $httpagenti = getenv ("HTTP_USER_AGENT");
  ?>
<?php } else {
  require ("partials/_sendmail.php");
  } ?>
      <div class="center top-spacer_20"> To make a request contact us via <a href="http://www.facebook.com/ynotradio" target=_new>Facebook</a>, AIM at IMYNotRadio, or text to 267-293-YNOT (9668).</div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
