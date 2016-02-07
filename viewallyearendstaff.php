<?php

$page_file = "viewallyearendstaff.php";
$page_title = "View all Year End Staff Picks";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/yearend_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Year End Staff Picks</h1></center>

<?php
viewallyearendstaffpicks();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>