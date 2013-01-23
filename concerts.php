<?php

$page_file = "concerts.php";
$page_title = "Concerts";

require ("functions/main_fns.php");
require ("functions/concert_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Concerts</h1>
    <?php show_concerts(); ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
