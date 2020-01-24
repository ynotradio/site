<?php

$page_file = "editstory.php";
$page_title = "Edit Story";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/story_fns.php");
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

editstory($id)
?>
<a href="viewallstories.php"><< Back to All Stories</a>
</div>
<?php
}

require("ext/footer.php");
?>