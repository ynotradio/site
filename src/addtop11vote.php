<?php

$page_file = "addtop11vote.php";
$page_title = "Add Top 11 @ 11 Vote";

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
if (top11status() == "open"){
displayform();
} else {
echo "<center>Sorry but voting is currently closed.<br>Check back soon to vote for next week's Top 11 @ 11.";
}
?>

<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}

require("ext/footer.php");
?>