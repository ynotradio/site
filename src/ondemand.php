<?php

$page_file = "ondemand.php";
$page_title = "On Demand";

require ("functions/main_fns.php");
require ("functions/on_demand_fns.php");
require ("partials/_header.php");

$sort = "date";
	if ($_GET['sort'] != '') {
		$sort = $_GET['sort'];
	}
$id = "";
  if ($_GET['id'] != '') {
  	$id = $_GET['id'];
  }
/*----- CONTENT ------*/
?>
<div class="row">
  <div class="nine columns content">
    <h1>On Demand</h1>
    <?php
      if ($id == "") {
        echo '<div class="center">Sort: [ <a href="ondemand.php?sort=date">Newest</a> | <a href="ondemand.php?sort=artist">Artist</a> | <a href="ondemand.php?sort=text">List</a> | <a href="http://www.youtube.com/ynotradio" target="_new">Videos</a> | <a href="shows.php">Specialty Shows</a>  ] </div>';
        show_on_demand($sort);
      } else {
        echo '<table class="ondemand">';
        on_demand_player($id);
        echo '</table>';
        echo '<a href="ondemand.php?sort=text"><< Back to list</a>';
      }
    ?>
  </div>
  <div class="three columns"><?php require ("partials/_featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("partials/_footer.php"); ?>
