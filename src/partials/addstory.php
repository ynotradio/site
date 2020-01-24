<?php                              
$page_file = "addstory.php";
$page_title = "Add a Story";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/story_fns.php");
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
<center><h1>Add a Story</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addstory.php" method="post">
	<table id="story">
		<tr>
			<td>Headline:</td>
			<td colspan="2"><input type="text" name="headline" maxlength="55" size="45"></td>
		</tr>
		<tr>
			<td>Story:</td>
			<td colspan="2"><textarea name="story" cols=40 rows=10> </textarea></td>
		</tr>
		<tr>
			<td>Start Date:</td>
			<td><input type="text" name="start_date" maxlength="25" size="25"></td>
			<td>Format: yyyy-mm-dd</td>
		</tr>
		<tr>
			<td>End Date:</td>
			<td><input type="text" name="end_date" maxlength="25" size="25"></td>
			<td>Format: yyyy-mm-dd</td>
		</tr>
		<tr>
			<td>Picture:</td>
			<td colspan="2"><input type="text" name="pic" maxlength="120" size="64"></td>
		</tr>
		<tr>
			<td>Picture Link URL:</td>
			<td colspan="2"><input type="text" name="pic_url" maxlength="120" size="64"></td>
		</tr>
		<tr>
			<td>Priority:</td>
			<td colspan="2"><input type="text" name="priority" maxlength="5" size="15"></td>
		</tr>
		<tr><td colspan="3">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Story"></td></tr>
	</table>
</form>

<p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<?php
} // end if
else {

$start_date = $_POST['start_date'];
$end_date = $_POST['end_date'];
$headline = $_POST['headline'];
$story = $_POST['story'];
$pic = $_POST['pic'];
$pic_url = $_POST['pic_url'];
$priority = $_POST['priority'];

if (!$start_date || !$end_date || !$headline || !$story || !$priority)
{
	echo 'Error - missing value(s)';
	exit;
}


addstory($start_date, $end_date, $headline, $story, $pic, $pic_url, $priority);

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