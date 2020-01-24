<?php

$page_file = "deleteconcert.php";
$page_title = "Delete Concert";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/concert_fns.php");
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

deleteconcert($id)
?>
<a href="viewallconcerts.php"><< Back to All Concerts</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>