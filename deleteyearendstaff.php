<?php

$page_file = "deleteyearendstaff.php";
$page_title = "Delete Year End Staff Pick";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/yearend_fns.php");
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

deleteyearendstaffpick($id)
?>
<a href="viewallyearendstaff.php"><< Back to All Year End Staff Picks</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>