<?php                              
$page_file = "addad.php";
$page_title = "Add an Ad";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ads_fns.php");
open_db();

if ($_POST['action'] != "write"){
	$action = "add";
}

$target = $_GET['target'];
	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>Add an Ad</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addad.php" method="post">
	<table id="ad">
		<tr>
			<td>Name:</td>
			<td colspan="2"><input type="text" name="name" maxlength="55" size="45"></td>
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
			<td>Picture Link URL:</td>
			<td colspan="2"><input type="text" name="pic_url" maxlength="120" size="64" value ="<?php echo $target;?>"></td>
		</tr>
		<tr>
			<td>Link URL:</td>
			<td colspan="2"><input type="text" name="web_url" maxlength="120" size="64"></td>
		</tr>
		<tr><td colspan="3">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Ad"></td></tr>
	</table>
</form>

<p>** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<?php
} // end if
else {

$start_date = $_POST['start_date'];
$end_date = $_POST['end_date'];
$name = $_POST['name'];
$pic_url = $_POST['pic_url'];
$web_url = $_POST['web_url'];

if (!$start_date || !$end_date || !$name || !$pic_url || !$web_url)
{
	echo 'Error - missing value(s)';
	exit;
}


add_ad($name, $start_date, $end_date, $pic_url, $web_url);

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