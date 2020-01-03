<?php
                               
$page_file = "adddeejay.php";
$page_title = "Add a Deejay";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/deejay_fns.php");
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
<center><h1>Add a Deejay</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="adddeejay.php" method="post">
	<table id="add_deejay"">
		<tr>
			<td>Deejay Name:</td>
			<td><input type="text" name="name" maxlength="55" size="32"></td>
		</tr>
		<tr>
			<td>Show:</td>
			<td><input type="text" name="show" maxlength="55" size="32"></td>
		</tr>
		<tr>
			<td>Email:</td>
			<td><input type="text" name="email" maxlength="55" size="32"></td>
		</tr>
		<tr>
			<td>External Connect Text:</td>
			<td><input type="text" name="external_connect_text" maxlength="55" size="32"></td>
		</tr>
		<tr>
			<td>External Connect URL:</td>
			<td><input type="text" name="external_connect_url" maxlength="120" size="64"></td>
		</tr>		
		<tr>
			<td>Picture:</td>
			<td><input type="text" name="pic" maxlength="55" size="32"></td>
		</tr>
		<tr><td>
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save DeeJay"></td></tr>
	</table>
</form>
** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url
<p>
<?php
} // end if
else {

$name = $_POST['name'];
$show = $_POST['show'];
$email = $_POST['email'];
$external_connect_text = $_POST['external_connect_text'];
$external_connect_url = $_POST['external_connect_url'];
$pic = $_POST['pic'];


if (!$name)
{
	echo 'Error - missing name';
	exit;
}


adddeejay($name, $show, $email, $external_connect_text, $external_connect_url, $pic);

echo "<p><center><< <a href =\"adddeejay.php\" >Add another DeeJay</a> >></center>";
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