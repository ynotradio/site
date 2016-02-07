<?php

$page_file = "viewallyearendcontestants.php";
$page_title = "View all Year End Poll Contestants";

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
<center><h1>All Year End Polls Contestants</h1></center>
<?php show_contestants(); ?>
<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>