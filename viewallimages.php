<?php

$page_file = "viewallconcerts.php";
$page_title = "View all Concerts";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/image_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Images</h1></center>

<?php
viewallimages();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>