<?php

$page_file = "saveondemand.php";
$page_title = "Save OnDemand";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ondemand_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php

$id = $_GET['id'];
$image = $_POST['image'];
$date = $_POST['date'];
$headline = $_POST['headline'];
$note = $_POST['note'];
$songs = $_POST['songs'];
$url = $_POST['url'];
$source = $_POST['source'];


if (!$id || !date || !$image || !$headline || !$note || !$url || !$source)
{
	echo 'Error - missing value(s)';
	exit;
}

saveondemand($id, $date, $image, $headline, $note, $songs, $url, $source);

?>
<a href="viewallondemands.php"><< Back to All On Demands</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>