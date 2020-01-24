<?php

$page_file = "savemusic.php";
$page_title = "Save New Music";

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
$date = $_POST['date'];
$artist = $_POST['artist'];
$song = $_POST['song'];
$url = $_POST['url'];

if (!$id || !$date || !$artist || !$song)
{
	echo 'Error - missing value(s)';
	exit;
}

savemusic($id, $date, $artist, $song, $url);
echo "<center><h3>New Music has been saved<h3></center>";
?>
<a href="viewallmusic.php"><< Back to All Music</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>