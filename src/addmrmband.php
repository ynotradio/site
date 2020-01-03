<?php
                               
$page_file = "addmrmband.php";
$page_title = "Add a Modern Rock Band";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/mrm_fns.php");
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
<center><h1>Add a Modern Rock Band</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addmrmband.php" method="post">
	<table id="add_mrmband"">
		<tr>
			<td>Band Name:</td>
			<td><input type="text" name="name" maxlength="55" size="50"></td>
		</tr>
		<tr>
			<td>Name Abbr (7):</td>
			<td><input type="text" name="abbr" maxlength="7" size="7"></td>
		</tr>
		<tr>
			<td>Band Url:</td>
			<td><input type="text" name="url" maxlength="115" size="75" value="ynotradio.net"></td>
		</tr>
		<tr>
			<td>Seed:</td>
			<td><input type="text" name="seed" maxlength="5" size="10"></td>
		</tr>
		<tr>
			<td>Band Pic:</td>
			<td><input type="text" name="pic_url" maxlength="115" size="75"></td>
		</tr>
		<tr>
			<td>Placement:</td>
			<td><input type="text" name="placement" maxlength="5" size="10"></td>
		</tr>		
		<tr><td>
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Modern Rock Band"></td></tr>
	</table>
</form>
** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<p>
<?php
} // end if
else {

$name = $_POST['name'];
$url = $_POST['url'];
$pic_url = $_POST['pic_url'];
$placement = $_POST['placement'];
$seed = $_POST['seed'];
$abbr = $_POST['abbr'];

if (!$name || !$url || !$pic_url || !$placement || !$seed || !$abbr)
{
	echo 'Error - missing value(s)';
	exit;
}


addmrmband($name, $url, $pic_url, $placement, $seed, $abbr);

echo "<p><center><< <a href =\"addmrmband.php\" >Add another Modern Rock Band</a> >></center>";
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