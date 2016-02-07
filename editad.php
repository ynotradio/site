<?php

$page_file = "editad.php";
$page_title = "Edit Ad";

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

edit_ad($id)
?>
<a href="viewallactiveads.php"><< Back to All Ads</a>
</div>
<?php
}

require("ext/footer.php");
?>