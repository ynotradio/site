<?php

$page_file = "ondemand.php";
$page_title = "On Demand";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ondemand_fns_new.php");
open_db();
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

<div id="on_demand">
<h1>On Demand</h1>
<p>
<center>
<?php
if ($id == "") {
echo 'Sort: [ <a href="ondemand_new.php?sort=date">Newest</a> | <a href="ondemand_new.php?sort=artist">Artist</a> | <a href="ondemand_new.php?sort=text">List</a> ]	
</center>';
  showondemand($sort);
} else {
  ondemandplayer($id);
  echo "<p>\n".
  '<a href="ondemand_new.php?sort=text"><< Back to list</a>'.
  "</center>";
}
?>
</div>
<div id="ads">
<?php
require("ads.php");
?>
</div>
<div style="clear:both;"></div>
<?php require ("ext/footer.php"); ?>
