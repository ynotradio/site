<?php

$page_file = "copyday.php";
$page_title = "Copy Day";

require ("functions/main_fns.php");
require ("partials/_header.php");
require ("ext/schedule_fns_new.php");
open_db();

$action = "view";
	if ($_POST['action'] != '') {
		$action = $_POST['action'];
	}

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">

<?php
  
if ($action == "view"){
  $date = $_GET['date'];
  if (!$date)
  {
  	echo 'Error - missing value(s)';
  	exit;
  }
  displayday($date);
}else { 
  $new_date = $_POST['new_date'];
  $original_date = $_POST['original_date'];
  
  if (!$new_date || !$original_date)
  {
  	echo 'Error - missing value(s)';
  	exit;
  }
  copyday($new_date, $original_date);
}
  
?>

<p>
<a href="schedule_view_all.php"><< View Schedule</a>
</div>
<?php
}

require("ext/footer.php");
?>