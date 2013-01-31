<?php

$page_file = "schedule.php";
$page_title = "Schedule";

require ("functions/main_fns.php");
require ("functions/schedule_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Schedule</h1>
    <?php display_schedule(); ?>
    <div class="footnote">**All times listed are in Eastern Standard Time (EST)</div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>

