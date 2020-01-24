<?php

$page_file = "edit_yr_entry.php";
$page_title = "Edit Year End Poll Entry";

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
$poll = $_GET['poll'];
$action = $_GET['action'];
$insert = $_GET['insert'];

$keys = array_keys($_POST);
$value1 = $_POST[$keys[0]];
$value2 = $_POST[$keys[1]];

if ($action == 'save') {
  save_year_end_poll_entry_for($poll, $id, $keys[0], $value1, $keys[1], $value2, $insert);
} elseif ($action == 'delete') {
  delete_year_end_poll_entry_for($poll, $id);
} elseif ($action == 'insert') {
  insert_year_end_poll_entry_for($poll);
} else {
  if (!$id || !$poll)
  {
  	echo 'Error - missing value(s)';
  	exit;
  }
  edit_year_end_poll_entry_for($poll, $id); 
}
?>

<p>
<a href="viewallyearendpollresults.php"><< Back to Year End Poll</a>
</div>
<?php
}

require("ext/footer.php");
?>