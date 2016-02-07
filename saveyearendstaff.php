<?php

$page_file = "saveyearendstaff.php";
$page_title = "Save Year End Staff Pick";

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

<?php

$id = $_GET['id'];
$order = $_POST['order'];
$html = $_POST['html'];

if (!$id || !$order || !$html)
{
	echo 'Error - missing value(s)';
	exit;
}

saveyearendstaff($id, $order, $html);
echo "<center><h3>Year End Staff Pick has been saved<h3></center><p>";
showyearendstaffpick($id);
echo "<p>";
?>
<a href="viewallyearendstaff.php"><< Back to View All Year End Staff Picks</a> | <a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>