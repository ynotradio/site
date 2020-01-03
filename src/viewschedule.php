<?php

$page_file = "viewschedule.php";
$page_title = "View Schedule";

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
<center><h1>Schedule</h1>

<?php
vs();
?>
</center>
<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>