<?php

$page_file = "cdoftheweek.php";
$page_title = "CD of The Week";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/cdotw_fns.php");

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <h1></h1>
    <h1>CD of The Week</h1>
    <?php cdotw($_GET['id']); ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<div class ="row">
  <div class="twelve columns content">
    <h2>See other reviews:</h2>
    <?php cover_art(); ?>
  </div>
</div>
<?php require ("ext/footer.php"); ?>
