<?php
                               
$page_file = "addschedule.php";
$page_title = "Add to Schedule";

require ("ext/main_fns.php");
require ("ext/header.php");
require ("ext/schedule_fns.php");
open_db();

if ($_POST['action'] != "write"){
	$action = "add";
}	

	
if (!$_SESSION["logged_in"]) {
  loginPrompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {
/*----- CONTENT ------*/
?>
<div id="cp">
<center><h1>Add to Schedule</h1></center>
<div id="admin">
<?php if ($action == "add") { ?>
<form action="addschedule.php" method="post">
	<table id="schedule_add"">
		<tr>
		<td>Date:</td>
		<td><input type="text" name="date" maxlength="25" size="25"></td>
		<td>Format: yyyy-mm-dd</td>
	  </tr>
		<tr>
			<td>Day:</td>
			<td colsplan="2"><select name="day">
					<option value="Sunday">Sunday</option>
					<option value="Monday">Monday</option>
					<option value="Tuesday">Tuesday</option>
					<option value="Wednesday">Wednesday</option>
					<option value="Thursday">Thursday</option>
					<option value="Friday">Friday</option>
					<option value="Saturday">Saturday</option>
				</select>
		</tr>
		<tr>
			<td>Start Time:</td>
			<td><input type="text" name="start_time" value="00:00:00" maxlength="25" size="25"></td>
			<td>Format: hh:mm:ss (24 hour)</td>
		</tr>
		<tr>
			<td>End Time:</td>
			<td><input type="text" name="end_time" value="00:00:00" maxlength="25" size="25"></td>
			<td>Format: hh:mm:ss (24 hour)</td>
		</tr>
		<tr>
			<td>Host:</td>
			<td colspan="2"><input type="text" name="host" maxlength="60" size="50"></td>
		</tr>
		<tr>
			<td>Notes:</td>
			<td colspan="2"><textarea name="note" cols=40 rows=10> </textarea></td>		
		</tr>
		<tr><td colspan="3">
		<input type="hidden" name="action" value="write">
		<input type="submit" value="Save Schedule"></td></tr>
	</table>
</form>
<?php
} // end if
else {

$date = $_POST['date'];
$day = $_POST['day'];
$start_time = $_POST['start_time'];
$end_time = $_POST['end_time'];
$host = $_POST['host'];
$note = $_POST['note'];

if (!$date || !$day || !$start_time || !$end_time || !$host)
{
	echo 'Error - missing value(s)';
	exit;
}

addschedule($date, $day, $start_time, $end_time, $host, $note);

echo "<p><center><< <a href =\"addschedule.php\" >Add More Schedules</a> >></center>";
} //end else

?>
</div>
<div style="clear:both;"></div>
<a href="viewschedule.php"> << View Full Schedule</a>
<br>
<a href="cp.php"> << Back to Control Panel</a>
</div>
<?php
}
require("ext/footer.php");
?>