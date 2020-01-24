<?php

$page_file = "editondemand.php";
$page_title = "Edit On Demand";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ondemand_fns.php");
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

editondemand($id)
?>

<p>
<a href="viewallondemands.php"><< Back to All On Demands</a>
</div>
<?php
}

require("ext/footer.php");
?>
