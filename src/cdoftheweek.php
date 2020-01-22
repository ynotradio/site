<?php

$page_file = "cdoftheweek.php";
$page_title = "CD of The Week";

require ("functions/main_fns.php");
require ("functions/cdotw_fns.php");
require ("partials/_header.php");

$cd_id = isset($_GET['id']) ? $_GET['id'] : null;

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns">
    <h1>CD of The Week</h1>
    <?php cdotw($cd_id); ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<div class ="row">
  <div class="twelve columns content">
    <h2>See other reviews:</h2>
    <?php cover_art(); ?>
  </div>
</div>
<?php require ("partials/_footer.php"); ?>
