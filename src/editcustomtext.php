<?php

$page_file = "editcustomtext.php";
$page_title = "Edit Custom Text";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/custom_text_fns.php");
open_db();

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php
$id = $_GET['id'];

if (!$id)
{
	echo 'Error - missing value(s)';
	exit;
}

editcustomtext($id)
?>

<p>
<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}

require("ext/footer.php");
?>