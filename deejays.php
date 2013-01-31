<?php

$page_file = "deejays.php";
$page_title = "DeeJays";

require ("functions/main_fns.php");
require ("functions/deejay_fns.php");
require ("partials/_header.php");

$deejays = get_deejays();

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>DeeJays</h1>
    <div class="row">
      <div class="twelve columns">
        <?php display_all_deejays($deejays[0]); ?>
      </div>
      <div class="six columns">
        <?php display_all_deejays($deejays[1]); ?>
      </div>
      <div class="six columns">
        <?php display_all_deejays($deejays[2]); ?>
      </div>
    </div>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
