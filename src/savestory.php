<?php

$page_file = "savestory.php";
$page_title = "Save Story";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/story_fns.php");
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
$headline = $_POST['headline'];
$story = $_POST['story'];
$pic = $_POST['pic'];
$pic_url = $_POST['pic_url'];
$priority = $_POST['priority'];

if (!$id || !$start_date || !$end_date || !$headline || !$story || !$priority)
{
	echo 'Error - missing value(s)';
	exit;
}

savestory($id, $start_date, $end_date, $headline, $story, $pic, $pic_url, $priority)

?>
<center><h1>Story (<?php echo $headline ?> ) has been saved</h1></center>
<a href="viewallstories.php"><< Back to All Stories</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>