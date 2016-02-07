<?php

$page_file = "viewallmusic.php";
$page_title = "View all New Music";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/music_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All New Music</h1></center>

<?php
viewallmusic();
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>