<?php

$page_file = "deletedeejay.php";
$page_title = "Delete Deejay";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/deejay_fns.php");
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

deletedeejay($id)
?>
<a href="viewalldeejays.php"><< Back to All Deejays</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>