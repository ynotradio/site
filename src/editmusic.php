<?php

$page_file = "editmusic.php";
$page_title = "Edit New Music";

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

editmusic($id)
?>

<p>
<a href="viewallmusic.php"><< Back to All New Music</a>
</div>
<?php
}

require("ext/footer.php");
?>