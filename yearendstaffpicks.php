<?php

$page_file = "yearendstaffpicks.php";
$page_title = "Year End Staff Picks";

require ("functions/main_fns.php");
require ("functions/year_end_staff_pick_fns.php");
require ("partials/_header.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="twelve columns content">
    <div class="center top-spacer_20 bottom-spacer_20"><img src="images/yearend2013_banner.jpg" alt="YNot Year End Poll 2013" width="900px"></div>
    <h1><?php echo date('Y');?> Y-Not Staff Favorites</h1>
    <?php show_year_end_staff_picks(); ?>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
