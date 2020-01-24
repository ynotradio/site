<?php

$page_file = "viewallmrmmatchess.php";
$page_title = "View all Modern Rock Matches";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/mrm_fns.php");
open_db();

if ($_GET['action'] ==""){
	$action = "view";
} else {
	$action = $_GET['action'];
}

$round = 1;
if ($_POST['round'] != ''){
	$round = $_POST['round'];
}
if ($_GET['round'] != ''){
	$round = $_GET['round'];
}

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Modern Rock Matches</h1></center>
		<form action="viewallmrmmatches.php" method="post">
		<center>Select a round:
			<select name="round" onchange="javascript:this.form.submit();">
			<?php $rounds = array();
			
			for ($i=1; $i<=6; $i++)
			{
			array_push($rounds, $i);				
			}
												
			foreach ($rounds as $roundvalue) {
					if ($roundvalue == $round){
					echo '<option value="'.$roundvalue.'" selected="'.$roundvalue.'">Round '.$roundvalue.'</option>'. "\n";
					}
					else {
					echo '<option value="'.$roundvalue.'">Round '.$roundvalue.'</option>'. "\n";
					}
					} ?>
			</select>
		</center>
		<br>
			</form>
<?php 			
	echo "<center><b>Round " . $round . "</b></center>";

	if ($action == "view") {
		view_matches($round);
	} elseif ($action == "write") {
		$match = $_GET['match'];
		$band = $_GET['band'];
		vote($match, $band, $round);
	} elseif ($action == "close") {
		$match = $_GET['match'];
		close_match($match, $round);
	}
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>