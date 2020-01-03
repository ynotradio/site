<?php

$page_file = "deletead.php";
$page_title = "Delete Ad";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ads_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php
$id = $_GET['id'];

if (!$id)
{
	echo 'Error - missing value(s)';
	exit;
}

delete_ad($id)
?>
<a href="viewallactiveads.php"><< Back to All Ads</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>