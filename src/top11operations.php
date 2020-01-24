<?php

$page_file = "top11operations.php";
$page_title = "Top 11 Song Operations";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/top11_fns.php");

open_db();

$action = $_GET['action'];
if ($_GET['action'] == ""){
	$action = "show";
}

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div style="padding: 2em;">

<script LANGUAGE="Javascript">
<!---
function decision(message, url){
if(confirm(message)) location.href = url;
}
// --->
</script>

<?php 
if ($action == "show"){
	echo '<ul>
	  <li><a href="top11operations.php?action=stats">See Top 11 Stats</a></li>
	  <li><a href="top11operations.php?action=write_ins">See Top 11 Write-in Votes</a></li>
	  <li><a href="top11operations.php?action=winner">Get Random Top 11 Winner</a></li>
	  <li><a href="top11operations.php?action=contestants">See All Top 11 Contestants</a></li>
	  <li><a href="top11operations.php?action=export">Export Top 11 Contestants</a></li>
	  <li> <a href="javascript:decision(\'Are you sure you want to Nuke the Top 11 Data?\',
	  \'top11operations.php?action=nuke\')">Nuke Top 11 Stats, Write-ins, Contestants & IP Addresses</A></li>
	  <li><a href="top11operations.php?action=status">Top 11 is currently: ' . top11status() .' (click to change)</a></li>
	</ul>';
}

if ($action == "stats"){
	stats();
}

if ($action == "write_ins"){
	view_write_ins();
}

if ($action == "winner"){
	echo "<center><h1>Winner!</h1>".top11contestantcount()."</center>";
	pickawinner();
}

if ($action == "contestants"){
	echo "<center><h2>All Top 11 Contestants</h2></center>";
	seecontestants();	
}

if ($action == "export"){
	echo "<center><h2>Top 11 Contestants:</h2></center>";
	export();
	echo "<center><h2>Non-contestant voters - add to Newsletter:</h2></center>";
	exportnewsletter();
}

if ($action == "nuke"){
	echo "<h1><center>Top 11 Values have been nuked!</center></h1>";
	nuke();
}

if ($action == "status"){
	if (top11status() == "open"){
		closetop11();
		echo "<center>You have closed Top 11 voting</center>";
	}
	elseif (top11status() == "close"){
		opentop11();	
		echo "<center>You have opened Top 11 voting</center>";
	}
}

if ($action != "show"){
echo "<p> <a href=\"top11operations.php\"><< Back to Top 11 Operations</a> |";
}

?>

<a href="cp.php"><< Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>