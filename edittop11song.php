<?php

$page_file = "edittop11song.php";
$page_title = "Edit Top 11 Song";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
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

edittop11song($id)
?>
<a href="viewalltop11songs.php"><< Back to All Top 11 Songs</a>
</div>
<?php
}

require("ext/footer.php");
?>