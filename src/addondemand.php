<?php
                               
$page_file = "addondemand.php";
$page_title = "Add an On Demand entry";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ondemand_fns.php");
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
<center><h1>Add an On Demand Entry</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addondemand.php" method="post">
	<table id="add_ondemand"">
		<tr>
			<td>Date:</td>
			<td><input type="text" name="date" maxlength="25" size="25"> Format: yyyy-mm-dd</td>
		</tr>
		<tr>
			<td>Band's Picture (URL):</td>
			<td colspan="2"><input type="text" name="image" maxlength="115" size="90"></td>
		</tr>
		<tr>
			<td>Headline:</td>
			<td colspan="2"><input type="text" name="headline" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Note:</td>
			<td colspan="2"><input type="text" name="note" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Songs Performed:</td>
			<td colspan="2"><input type="text" name="songs" maxlength="250" size="90"></td>
		</tr>
		<tr>
			<td>Audio URL:</td>
			<td colspan="2"><input type="text" name="url" maxlength="115" size="90"></td>
		</tr>
		<tr>
			<td>Audio Source:</td>
			<td><input type="radio" name="source" value="opendrive" checked/> Open Drive<br>
			<input type="radio" name="source" value="4shared" /> 4Shared </td>
		</tr>
		<tr><td colspan="2">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save On Demand"></td></tr>
	</table>
</form>
** if any audio url is over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<p>
<?php
} // end if
else {

$date = $_POST['date'];
$image = $_POST['image'];
$headline = $_POST['headline'];
$note = $_POST['note'];
$songs = $_POST['songs'];
$url = $_POST['url'];
$source = $_POST['source'];


if (!$date || !$image || !$headline || !$note || !$url || !$source)
{
	echo 'Error - missing value(s)';
	exit;
}


addondemand($date, $image, $headline, $note, $songs, $url, $source);

echo "<p><center><< <a href =\"addondemand.php\" >Add another On Demand Entry</a> >></center>";
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