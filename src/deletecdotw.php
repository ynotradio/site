<?php

$page_file = "deletecdotw.php";
$page_title = "Delete CD of The Week";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/cdotw_fns.php");
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

deletecdotw($id)
?>
<a href="viewallcdotw.php"><< Back to All CD of the Weeks</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>