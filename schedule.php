<?php

$page_file = "schedule.php";
$page_title = "Schedule";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/schedule_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>Schedule</h1>
    <?php display_schedule(); ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>

