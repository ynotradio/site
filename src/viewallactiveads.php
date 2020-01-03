<?php

$page_file = "viewallactiveads.php";
$page_title = "View all Active Ads";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ads_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Active Ads</h1></center>

<?php
viewallactive_ads();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>