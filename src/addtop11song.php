<?php                              
$page_file = "addtop11song.php";
$page_title = "Add a Top 11 Song";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
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
<center><h1>Add a Top 11 Song</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addtop11song.php" method="post">
	<table id="top11song">
		<tr>
			<td>Artist:</td>
			<td><input type="text" name="artist" maxlength="55" size="45"></td>
		</tr>
		<tr>
			<td>Song:</td>
			<td><input type="text" name="song" maxlength="55" size="45"></td>
		</tr>
		<tr><td colspan="2">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Top 11 Song"></td></tr>
	</table>
</form>
<?php
} // end if
else {

$artist = $_POST['artist'];
$song = $_POST['song'];

if (!$artist || !$song)
{
	echo 'Error - missing value(s)';
	exit;
}

addtop11song($artist, $song);

echo "<p><< <a href=\"addtop11song.php\"> Add Another Song</a>>>";

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