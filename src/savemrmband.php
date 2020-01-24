<?php

$page_file = "savemrmband.php";
$page_title = "Save Modern Rock Band";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/mrm_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php

$id = $_GET['id'];
$name = $_POST['name'];
$url = $_POST['url'];
$pic_url = $_POST['pic_url'];
$placement = $_POST['placement'];
$seed = $_POST['seed'];
$abbr = $_POST['abbr'];

if (!$id || !$name || !$url || !$pic_url || !$placement || !$seed || !$abbr)
{
	echo 'Error - missing value(s)';
	exit;
}

savemrmband($id, $name, $url, $pic_url, $placement, $seed, $abbr);

?>
<a href="viewallmrmbands.php"><< Back to All Modern Rock Bands</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>