<?php

$page_file = "saveorder.php";
$page_title = "Save Order";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/story_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<?php

foreach ($_POST as $k=>$v) { 
	saveorder($k, $v);
}

?>
<p>
<center><h1>Story Order has been saved</h1></center>
<a href="orderstories.php"><< Back to Ordering Stories</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>