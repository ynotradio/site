<?php

$page_file = "savedeejay.php";
$page_title = "Save Deejay";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/deejay_fns.php");
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
$show = $_POST['show'];
$email = $_POST['email'];
$external_connect_text = $_POST['external_connect_text'];
$external_connect_url = $_POST['external_connect_url'];
$pic = $_POST['pic'];

if (!$id || !$name)
{
	echo 'Error - missing value(s)';
	exit;
}

savedeejay($id, $name, $show, $email, $external_connect_text, $external_connect_url, $pic)

?>
<a href="viewalldeejays.php"><< Back to All Deejays</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>