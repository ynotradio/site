<?php

$page_file = "yearendstaffpicks.php";
$page_title = "Year End Staff Picks";

require ("functions/main_fns.php");
require ("functions/year_end_staff_pick_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Year End Staff Picks</h1>
    <?php show_year_end_staff_picks(); ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
