<?php
                               
$page_file = "yearenedstaff.php";
$page_title = "Add Year End Staff Picks";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/yearend_fns.php");
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
<center><h1>Add Year End Staff Pick</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addyearendstaff.php" method="post">
	<table id="music"">
		<tr>
			<td>Order:</td>
			<td><input type="text" name="order" maxlength="10" size="10"></td>
		</tr>
		<tr>
			<td>HTML:</td>
			<td><textarea name="html" cols=100 rows=25> </textarea></td>
		</tr>
		<tr><td colspan="2">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Staff Pick"></td></tr>
	</table>
</form>
<?php
} // end if
else {

$order = $_POST['order'];
$html = $_POST['html'];

if (!$order || !$html)
{
	echo 'Error - missing value(s)';
	exit;
}

addstaffpick($order, $html);

echo "<p><center><< <a href =\"addyearendstaff.php\" >Add More Staff Picks</a> >></center>";
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