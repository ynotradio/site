<?php
                               
$page_file = "addmusic.php";
$page_title = "Add New Music";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/music_fns.php");
open_db();

if ($_POST['action'] != "write"){
	$action = "add";
}	

	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>Add New Music</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addmusic.php" method="post">
	<table id="music"">
		<tr>
			<td>Date:</td>
			<td><input type="text" name="date" maxlength="25" size="25"></td>
			<td>Format: yyyy-mm-dd</td>
		</tr>
		<tr>
			<td>Artist:</td>
			<td colspan="2"><input type="text" name="artist" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Song:</td>
			<td colspan="2"><input type="text" name="song" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Song URL:</td>
			<td colspan="2"><input type="text" name="url" maxlength="100" size="75"></td>
		</tr>
		<tr><td colspan="3">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Music"></td></tr>
	</table>
</form>
<?php
} // end if
else {

$date = $_POST['date'];
$artist = $_POST['artist'];
$song = $_POST['song'];
$url = $_POST['url'];


if (!$date || !$artist || !$song)
{
	echo 'Error - missing value(s)';
	exit;
}

addmusic($date, $artist, $song, $url);

echo "<p><center><< <a href =\"addmusic.php\" >Add More Music</a> >></center>";
} //end else

?>
</div>
<div style="clear:both;"></div>
<a href="cp.php"> << Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>