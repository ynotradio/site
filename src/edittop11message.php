<?php

$page_file = "edittop11message.php";
$page_title = "Edit Top 11 @ 11 Message";

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

<?php
edittop11message();
?>
<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}

require("ext/footer.php");
?>