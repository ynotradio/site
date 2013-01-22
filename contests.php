<?php

$page_file = "contests.php";
$page_title = "Contests";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/custom_text_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Y-Not Radio Contests</h1>
    <?php display_custom_text(3); ?>   
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
