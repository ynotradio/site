<?php
                               
$page_file = "addconcert.php";
$page_title = "Add a Concert";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/concert_fns.php");
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
<center><h1>Add a Concert</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addconcert.php" method="post">
	<table id="add_concert"">
		<tr>
			<td>Date:*</td>
			<td><input type="text" name="date" maxlength="25" size="25"> Format: yyyy-mm-dd</td>
		</tr>
		<tr>
			<td>Artist:*</td>
			<td colspan="2"><input type="text" name="artist" maxlength="250" size="90"></td>
		</tr>
		<tr>
			<td>Band's Picture (URL):</td>
			<td><input type="text" name="band_pic_url" maxlength="115" size="90"></td>
		</tr>
		<tr>
			<td>Band's Site (URL):</td>
			<td><input type="text" name="band_url" maxlength="115" size="90"></td>
		</tr>
		<tr>
			<td>Venue:*</td>
			<td colspan="2"><input type="text" name="venue" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Ticket Info:*</td>
			<td colspan="2"><input type="text" name="ticketinfo" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Ticket URL:*</td>
			<td colspan="2"><input type="text" name="ticketurl" maxlength="115" size="90"></td>
		</tr>
		<tr>
			<td>Feature Concert:</td>
			<td colspan="2"><input type="checkbox" name="featured" value="Yes" /></td>
		</tr>
		<tr><td colspan="2">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Concert"></td></tr>
	</table>
</form>
** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<p>
<?php
} // end if
else {

$date = $_POST['date'];
$artist = $_POST['artist'];
$band_pic_url = $_POST['band_pic_url'];
$band_url = $_POST['band_url'];
$venue = $_POST['venue'];
$ticketinfo = $_POST['ticketinfo'];
$ticketurl = $_POST['ticketurl'];
$featured = $_POST['featured'];


if (!$date || !$artist || !$venue || !$ticketinfo || !$ticketurl)
{
	echo 'Error - missing value(s)';
	exit;
}


addconcert($date, $artist, $band_pic_url, $band_url, $venue, $ticketinfo, $ticketurl, $featured);

echo "<p><center><< <a href =\"addconcert.php\" >Add another Concert</a> >></center>";
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