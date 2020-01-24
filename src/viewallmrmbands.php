<?php

$page_file = "viewallmrmbands.php";
$page_title = "View all Modern Rock Bands";

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
<center><h1>All Modern Rock Bands</h1></center>

<?php
viewallmrmbands();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>