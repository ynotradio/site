<?php

$page_file = "editdeejay.php";
$page_title = "Edit Deejay";

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

editdeejay($id)
?>

<p>
<a href="viewalldeejays.php"><< Back to All Deejays</a>
</div>
<?php
}

require("ext/footer.php");
?>