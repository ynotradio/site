<?php

$page_file = "savetop11song.php";
$page_title = "Save Top 11 Song";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<?php

$id = $_GET['id'];
$artist = $_POST['artist'];
$song = $_POST['song'];

if (!$id || !$artist || !$song)
{
	echo 'Error - missing value(s)';
	exit;
}

savetop11song($id, $artist, $song)

?>
<center><h3>Top 11 Song: (<?php echo $artist. " - ". $song ?> ) has been saved</h3></center>
<a href="viewalltop11songs.php"><< Back to All Top 11 Songs</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>