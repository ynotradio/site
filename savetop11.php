<?php

$page_file = "savetop11.php";
$page_title = "Save Top 11 @ 11";

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
$count = 1;
$placement = 1;
foreach ($_POST as $k=>$v) { 
	if ($k != "date") {	
		if ($count == 1) {
			$artist = $v;
		} if ($count == 2) {
			$song = $v;;
		} if ($count == 3) {
			$count = 0;
			//echo ($placement/3) ." = " . $artist . " - " . $song . " - " . $v . "<br>";	
			savetop11(($placement/3), $artist, $song, $v);
		}
		$count++;
		$placement ++;
	} else {
		savetop11date($v);
	}
		
}	



//savetop11($id, $start_date, $end_date, $headline, $story, $priority)

?>
<center><h1>Top 11 @ 11 has been Saved!</h1></center>
<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>