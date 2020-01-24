<?php

$page_file = "edityearendstaff.php";
$page_title = "Edit Year End Staff Pick";

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

edityearendstaffpick($id)
?>

<p>
<a href="viewallyearendstaff.php"><< Back to Year End Staff Picks</a>
</div>
<?php
}

require("ext/footer.php");
?>