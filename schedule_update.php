<?php

$page_file = "schedule_update.php";
$page_title = "Update Schedule";

require ("functions/main_fns.php");
require ("functions/schedule_fns.php");
require ("partials/_header.php");

$id = $_GET['id'];

if ($_POST['action'] != "update")
	$action = "update";

if ($_GET['action'] == "copy")
  $action = "copy";

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Update a Schedule</h1>
    <?php
      if (!$id) {
        echo '<div class="top-spacer_20 center error">Error - missing ID value</div>';
      } elseif ($action == "update") {
        $schedule = get_schedule($id);
        echo "<form action=\"schedule_update.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_schedule_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";
      } elseif ($action == "copy") {
        $schedule = get_schedule($id);
        echo "<form action=\"schedule_add.php?id=".$id."\" method=\"post\" class=\"form-internal inline input-seperation\" id=\"admin\">";
        require ("partials/_schedule_form.php");
        echo "</form>
        <div class=\"footnote\">** if any links are over 128 characters: use <a href=\"http://www.bit.ly\" target=_new>bit.ly</a> to shorten the url</div>";        
      } else {
        $host = $_POST['host'];
        $date = $_POST['date'];
        $start_time = $_POST['start_time'];
        $end_time = $_POST['end_time'];
        $note = $_POST['note'];

        if (!$host || !$date || !$start_time || !$end_time) {
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        } else {
          $result = update_schedule($id, $host, $date, $start_time, $end_time, $note);
          if ($result) {
            echo '<div class="top-spacer_20 center"><h1>Update was successful!</h1>';
            display_schedule(get_schedule($id));
            echo "</div>";
          }
        }
      }
    ?>
    <div class="top-spacer_20">
      <a href="schedule_view_all.php">Back to all Schedules</a>
      <p>
      <a href="cp.php">Back to the control panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
