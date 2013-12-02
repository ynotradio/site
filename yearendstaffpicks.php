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
    <h1>Year End Staff Picks</h1>
    <div class="center bottom-spacer_20"><img src="images/yearend2013_banner.jpg" alt="YNot Year End Poll 2013" width="900px"></div>
    <?php show_year_end_staff_picks(); ?>
  </div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
