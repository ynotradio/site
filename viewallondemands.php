<?php

$page_file = "viewallondemands.php";
$page_title = "View all On Demands";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/ondemand_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All On Demands</h1></center>

<?php
viewallondemands();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>