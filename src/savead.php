<?php

$page_file = "savead.php";
$page_title = "Save Ad";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ads_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<?php

$id = $_GET['id'];
$start_date = $_POST['start_date'];
$end_date = $_POST['end_date'];
$name = $_POST['name'];
$pic_url = $_POST['pic_url'];
$web_url = $_POST['web_url'];

if (!$id || !$start_date || !$end_date || !$name || !$pic_url || !$web_url)
{
	echo 'Error - missing value(s)';
	exit;
}

save_ad($id, $name, $start_date, $end_date, $pic_url, $web_url)

?>
<center><h1>Ad for (<?php echo $name ?> ) has been saved</h1></center>
<a href="viewallactiveads.php"><< Back to All Ads</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>