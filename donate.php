<?php

$page_file = "dontate.php";
$page_title = "Donate";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/custom_text_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1></h1>
    <h1>Donate to Y-Not Radio</h1>
    <?php display_custom_text(1); ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
