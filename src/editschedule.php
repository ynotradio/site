<?php

$page_file = "editschedule.php";
$page_title = "Edit Schedule";

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

if (!$id)
{
	echo 'Error - missing value(s)';
	exit;
}

editschedule($id)
?>

<p>
<a href="viewschedule.php"><< Back to Schedule</a>
</div>
<?php
}

require("ext/footer.php");
?>