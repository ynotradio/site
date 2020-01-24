<?php

$page_file = "editconcert.php";
$page_title = "Edit Concert";

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

editconcert($id)
?>

<p>
<a href="viewallconcerts.php"><< Back to All Concerts</a>
</div>
<?php
}

require("ext/footer.php");
?>