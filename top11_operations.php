<?php

$page_file = "top11_operations.php";
$page_title = "Top 11 Operations";

require ("functions/main_fns.php");
require ("functions/top11_fns.php");
require ("partials/_header.php");

$action = $_GET['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST[username],$_POST[remember_me],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>

<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Top 11 Operations</h1>
    <?php
      if ($action == 'stats')
        stats();
      elseif ($action == 'write_ins')
        view_write_ins();
      elseif ($action == 'winner')
        pick_a_winner();
      elseif ($action == 'contestants')
        display_contestants();
      elseif ($action == 'export') {
        export();
        export_newsletter();
      } elseif ($action == 'nuke')
        nuke();
      elseif ($action == 'status')
        toggle_status(top11_status());
      else {
      echo '<ul>
        <li><a href="top11_operations.php?action=stats">See Top 11 Stats</a></li>
        <li><a href="top11_operations.php?action=write_ins">See Top 11 Write-in Votes</a></li>
        <li><a href="top11_operations.php?action=winner">Get Random Top 11 Winner</a></li>
        <li><a href="top11_operations.php?action=contestants">See All Top 11 Contestants</a></li>
        <li><a href="top11_operations.php?action=export">Export Top 11 Contestants</a></li>
        <li><a href="top11_operations.php?action=nuke" onClick="return confirm(\'Are you sure you want to Nuke the Top 11 Data?\')">Nuke Top 11 Stats, Write-ins, Contestants & IP Addresses</a></li>
        <li><a href="top11_operations.php?action=status">Top 11 is currently <b>' . top11_status() .'</b> (click to change)</a></li>
      </ul>';
      }
      if ($action != '')
        echo "<p>\n<a href=\"top11_operations.php\">Back to Top 11 Operations</a>";
  ?>
  <p>
  <a href="cp.php">Back to the control panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("partials/_footer.php");
?>

