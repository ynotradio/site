<?php

$page_file = "viewallstories.php";
$page_title = "View all Stories";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/cdotw_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All CD of The Weeks</h1></center>

<?php
viewallcdotw();
?>

<br>
<a href="cp.php"> << Back </a>
</div>

<?php
}
require("ext/footer.php");
?>