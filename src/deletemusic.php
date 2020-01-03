<?php

$page_file = "deletemusic.php";
$page_title = "Delete New Music";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/music_fns.php");
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

deletemusic($id)
?>
<a href="viewallmusic.php"><< Back to All New Music</a> | <a href="cp.php"><< Back to Control Panel</a> 
</div>
<?php
}

require("ext/footer.php");
?>