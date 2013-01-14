<?php

$page_file = "ondemand.php";
$page_title = "On Demand";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/on_demand_fns.php");

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
      echo '<div class="center">Sort: [ <a href="ondemand.php?sort=date">Newest</a> | <a href="ondemand.php?sort=artist">Artist</a> | <a href="ondemand.php?sort=text">List</a> ]</div>';
        show_on_demand($sort);
      } else {
        echo '<table class="ondemand">';
        on_demand_player($id);
        echo '</table>';
        echo '<a href="ondemand.php?sort=text"><< Back to list</a>';
      }
    ?>
  </div>
  <div class="three columns"><?php require ("featured_concerts_and_ads.php") ?></div>
</div> <!-- end of row div -->
<?php require ("ext/footer.php"); ?>
