<?php

$page_file = "viewalltop11songs.php";
$page_title = "View all Top 11 Songs";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Top 11 Songs</h1></center>

<?php
viewalltop11songs();
?>

<br>
<a href="cp.php"> << Back </a>
</div>

<?php
}
require("ext/footer.php");
?>