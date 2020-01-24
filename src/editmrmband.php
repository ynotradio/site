<?php

$page_file = "editmrmband.php";
$page_title = "Edit Modern Rock Band";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/mrm_fns.php");
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

editmrmband($id)
?>

<p>
<a href="viewallmrmbands.php"><< Back to All Modern Rock Bands</a>
</div>
<?php
}

require("ext/footer.php");
?>