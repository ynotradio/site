<?php

$page_file = "savedonate.php";
$page_title = "Save Custom Text";

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
$html = $_POST['html'];

if (!$id || !$html)
{
	echo 'Error - missing value(s)';
	exit;
}

savecustomtext($id, $html);
echo "<center><h3>Custom Text has been saved<h3></center>";
?>
<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>