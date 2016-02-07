<?php

$page_file = "savetop11message.php";
$page_title = "Save Top 11 Message";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<?php

$message = $_POST['message'];

if (!$message)
{
	echo 'Error - missing value(s)';
	exit;
}

savetop11message($message);

?>
<center><h3>Top 11 Message has been saved</h3></center>
<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>