<?php

$page_file = "saveschedule.php";
$page_title = "Save Schedule";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/schedule_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php

$id = $_GET['id'];
$date = $_POST['date'];
$day = $_POST['day'];
$start_time = $_POST['start_time'];
$end_time = $_POST['end_time'];
$host = $_POST['host'];
$note = $_POST['note'];


if (!$id || !$date || !$start_time || !$end_time || !$host)
{
	echo 'Error - missing value(s)';
	exit;
}

saveschedule($id, $date, $day, $start_time, $end_time, $host, $note);
echo "<center><h3>The Schedule has been saved<h3></center>";
?>
<a href="viewschedule.php"><< Back to the Schedule</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>