<?php

$page_file = "concerts.php";
$page_title = "Concerts";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/concert_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Concerts</h1>
    <?php show_concerts(); ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
