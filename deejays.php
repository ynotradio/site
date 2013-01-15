<?php

$page_file = "deejays.php";
$page_title = "DeeJays";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/deejay_fns.php");

$deejays = get_deejays();

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>DeeJays</h1>
    <div class="row">
      <div class="twelve columns">
        <?php display_deejay($deejays[0]); ?>
      </div>
      <div class="six columns">
        <?php display_deejay($deejays[1]); ?>
      </div>
      <div class="six columns">
        <?php display_deejay($deejays[2]); ?>
      </div>
    </div>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
