<?php
                               
$page_file = "addcdotw.php";
$page_title = "Add a CD of the Week";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/cdotw_fns.php");
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
<center><h1>Add a CD of The Week</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addcdotw.php" method="post">
	<table id="add_cdotw"">
		<tr>
			<td>Artist:</td>
			<td colspan="2"><input type="text" name="artist" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Title:</td>
			<td colspan="2"><input type="text" name="title" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Label:</td>
			<td colspan="2"><input type="text" name="label" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Review:</td>
			<td colspan="2"><textarea name="review" cols=60 rows=15> </textarea></td>
		</tr>				
		<tr>
			<td>CD Picture URL:</td>
			<td colspan="2"><input type="text" name="cd_pic_url" maxlength="115" size="50"></td>
		</tr>
		<tr>
			<td>Band URL:</td>
			<td colspan="2"><input type="text" name="band" maxlength="115" size="50"></td>
		</tr>
		<tr>
			<td>Reviewer:</td>
			<td colspan="2"><input type="text" name="reviewer" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Date:</td>
			<td><input type="text" name="date" maxlength="25" size="25"></td>
			<td>Format: yyyy-mm-dd</td>
		</tr>
		<tr><td colspan="2">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save CD of the Week"></td></tr>
	</table>
</form>
** if the CD Picture URL is over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<p>
<?php
} // end if
else {

$artist = $_POST['artist'];
$title = $_POST['title'];
$label = $_POST['label'];
$review = $_POST['review'];
$cd_pic_url = $_POST['cd_pic_url'];
$band = $_POST['band'];
$reviewer = $_POST['reviewer'];
$date = $_POST['date'];


if (!$artist || !$title || !$label || !$review || !$cd_pic_url || !$band|| !$reviewer || !$date)
{
	echo 'Error - missing value(s)';
	exit;
}


addcdotw($artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date);

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