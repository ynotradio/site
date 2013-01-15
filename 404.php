<?php

$page_file = "404.php";
$page_title = "";

require ("ext/main_fns.php");
require ("ext/header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content center">
    <h2>
      Oh, No!
      <p>
      It seems that you have found a page that no longer is available.
      <p>
      <a href="contact">Contact Us</a>
      </h2>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
