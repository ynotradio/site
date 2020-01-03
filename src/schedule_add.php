<?php

$page_file = "schedule_add.php";
$page_title = "Add a Schedule";

require ("functions/main_fns.php");
require ("functions/schedule_fns.php");
require ("partials/_header.php");

$action = $_POST['action'];

$id = $_GET['id'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Add a Schedule</h1>
      <?php if ($action != "insert") { ?>
      <form action="schedule_add.php" method="post" class="form-internal inline input-seperation" id="admin">
        <?php require ("partials/_schedule_form.php"); ?>
      </form>
      <div class="footnote">** if any links are over 128 characters: use <a href="http://www.bit.ly" target=_new>bit.ly</a> to shorten the url</div>
    <?php
      } else {
        $host = $_POST['host'];
        $date = $_POST['date'];
        $start_time_submit = $_POST['start_time_submit'];
        $end_time_submit = $_POST['end_time_submit'];
        $start_time = $_POST['end_time'];
        $end_time = $_POST['end_time'];
        $note = $_POST['note'];

        if ($id != '') {
          $start_time = validate_time($start_time_submit, $id, "start_time");
          $end_time = validate_time($end_time_submit, $id, "end_time");
        } else {
          $start_time = $start_time_submit;
          $end_time = $end_time_submit;
        }

        if (!$host || !$date || !$start_time || !$end_time)
          echo '<div class="top-spacer_20 center error">Error - missing required value(s)</div>';
        else
          add_schedule($host, $date, $start_time, $end_time, $note);
      }
    ?>
    <div class="top-spacer_20">
      <?php if ($action == 'insert')
        echo "<a href=\"".$page_file."\">Add another Schedule</a>\n<p>";
      ?>
      <a href="cp.php">Control Panel</a>
    </div>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>
