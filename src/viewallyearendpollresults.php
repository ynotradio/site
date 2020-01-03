<?php

$page_file = "viewallyearendpollresults.php";
$page_title = "View all Year End Poll Results";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/yearend_fns.php");
open_db();

$poll = 1;
if ($_POST['poll'] != ''){
	$poll = $_POST['poll'];
}
if ($_GET['poll'] != ''){
	$poll = ucwords($_GET['poll']);
}

$poll_title = poll_title($poll);

if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>All Year End Polls | <?php echo $poll_title ?></h1></center>
		<form action="viewallyearendpollresults.php" method="post">
		<center>Select a poll:
			<select name="poll" onchange="javascript:this.form.submit();">
			<?php $polls = polls();
												
			foreach ($polls as $pollvalue => $title) {
					if ($pollvalue == $poll){
					echo '<option value="'.$pollvalue.'" selected="'. $pollvalue .'">'.$title.'</option>'. "\n";
					}
					else {
					echo '<option value="'.$pollvalue.'">'.$title.'</option>'. "\n";
					}
					} ?>
			</select>
		</center>
		<br>
			</form>
<?php
  $function_name = str_replace(" ", "_", strtolower($poll_title));
  echo "<p>
  <center>
  <a href='edit_yr_entry?poll=" . $function_name . "&action=insert'> Add a new entry in the " . $poll_title . " poll</a>\n</br>\n
  Write-ins below
  </center>
  </p>";
  call_user_func("display_" . $function_name . "_poll_data");
  disaply_write_ins($function_name);
?>

<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>

<?php
}
require("ext/footer.php");
?>