<?php

$page_file = "contests.php";
$page_title = "Contests";

require ("functions/main_fns.php");
require ("functions/custom_text_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Y-Not Radio Contests</h1>
    <?php display_custom_text(3); ?>   
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
