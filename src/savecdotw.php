<?php

$page_file = "savestory.php";
$page_title = "Save Story";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/cdotw_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<?php

$id = $_GET['id'];
$artist = $_POST['artist'];
$title = $_POST['title'];
$label = $_POST['label'];
$review = $_POST['review'];
$cd_pic_url = $_POST['cd_pic_url'];
$reviewer = $_POST['reviewer'];
$band = $_POST['band'];
$date = $_POST['date'];


if (!$id || !$artist || !$title || !$label || !$review || !$cd_pic_url || !$band || !$reviewer || !$date)
{
	echo 'Error - missing value(s)';
	exit;
}

savecdotw($id, $artist, $title, $label, $review, $cd_pic_url, $band, $reviewer, $date);

?>

<a href="viewallcdotw.php"><< Back to All CD of The Weeks</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>