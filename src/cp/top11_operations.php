<?php

$page_file = "top11_operations.php";
$page_title = "Top 11 Operations";

require ("../functions/main_fns.php");
require_once ("../models/Top11Factory.php");
require ("../partials/_header.php");

// Get the Top11 model
$db = open_db();
$top11Model = \YNotRadio\Models\Top11Factory::create($db);

$action = $_GET['action'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>

<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Top 11 Operations</h1>
    <?php
      if ($action == 'stats') {
        // Display Top11 statistics
        $songs = $top11Model->getAllSongs();
        // Sort by value in descending order
        usort($songs, function($a, $b) {
            return $b['value'] - $a['value'];
        });
        
        echo "<table class=\"table table-striped table-bordered-horizontal table-condensed table-center\">";
        echo "<thead><tr><th>Spot</th><th>Arist</th><th>Song</th><th>Value</th></tr></thead>";
        
        foreach ($songs as $i => $song) {
            echo "<tr><td>" . ($i + 1) . "</td>\n" .
                "<td>" . $song['artist'] . "</td>\n" .
                "<td>" . $song['song'] . "</td>\n" .
                "<td>" . $song['value'] . "</td>\n" .
                "</tr>\n";
        }
        echo "</table>\n";
      } elseif ($action == 'write_ins') {
        // Display write-in votes
        $writeIns = $top11Model->getAllWriteIns();
        echo "<ol>";
        foreach ($writeIns as $writeIn) {
            echo "<li>" . $writeIn['write_in'] . "</li>";
        }
        echo "</ol>";
      } elseif ($action == 'winner') {
        // Pick a random winner
        try {
            $winner = $top11Model->pickWinner();
            $contestantCount = $top11Model->getContestantCount();
            
            echo "<div class=\"center\">\n<h1>Winner!</h1>";
            echo "<b>Name: </b>" . $winner['firstname'] . " " . $winner['lastname'] . "<br>" .
                "<b>Email: </b>" . $winner['email'] . "<br>" .
                "<b>Phone: </b>" . $winner['phone'] . "<p>" .
                $contestantCount . "</div>\n";
        } catch (\Exception $e) {
            echo "<div class=\"alert alert-error\">Error selecting a winner: " . $e->getMessage() . "</div>";
        }
      } elseif ($action == 'contestants') {
        // Display all contestants
        $contestants = $top11Model->getAllContestants();
        echo "<h2 class=\"center\">All Top 11 Contestants</h2>";
        foreach ($contestants as $contestant) {
            echo "<ol>";
            echo "<b>Name: </b>" . $contestant['firstname'] . " " . $contestant['lastname'] .
                "<br><b>Email: </b>" . $contestant['email'] .
                "<br><b>Phone: </b>" . $contestant['phone'] .
                "<br><b>Newsletter: </b>" . $contestant['newsletter'] . "</ol>";
        }
      } elseif ($action == 'export') {
        // Export contestants and newsletter signups
        $contestants = $top11Model->getAllContestants();
        echo "<h2 class=\"center\">Top 11 Contestants</h2>";
        echo "<table class='table table-striped table-bordered-horizontal table-condensed table-center'>
            <thead><tr>\n<th>Name</th><th>Email</th><th>Phone</th><th>Newsletter</th></tr></thead>\n";
        foreach ($contestants as $contestant) {
            echo "<tr><td>" . $contestant['firstname'] . " " . $contestant['lastname'] . " </td>" .
                "<td>" . $contestant['email'] . "</td>" .
                "<td>" . $contestant['phone'] . "</td>" .
                "<td>" . $contestant['newsletter'] . "</td></tr>";
        }
        echo "</table>";
        
        // Newsletter signups (non-contestants)
        $newsletterSignups = $top11Model->getNewsletterSignups();
        echo "<h2 class=\"center\">Non-contestant voters - add to Newsletter</h2>
            <table class='table table-striped table-bordered-horizontal table-condensed no-header table-center'>";
        foreach ($newsletterSignups as $signup) {
            echo "<tr><td>" . $signup['firstname'] . " " . $signup['lastname'] . "</td>" .
                "<td>" . $signup['email'] . "</td></tr>";
        }
        echo "</table>";
      } elseif ($action == 'nuke') {
        // Reset all Top11 data
        try {
            $success = $top11Model->reset();
            if ($success) {
                echo "<div class=\"center\"><h2>Top 11 Values have been nuked</h2></div>";
                echo "<div class=\"center\">Top 11 Stats - <b>NUKED</b></div>";
                echo "<div class=\"center\">Top 11 Write-ins - <b>NUKED</b></div>";
                echo "<div class=\"center\">Top 11 Contestants - <b>NUKED</b></div>";
                echo "<div class=\"center\">IP Addresses - <b>NUKED</b></div>";
            } else {
                echo "<div class=\"alert alert-error\">Error resetting Top11 data</div>";
            }
        } catch (\Exception $e) {
            echo "<div class=\"alert alert-error\">Error: " . $e->getMessage() . "</div>";
        }
      } elseif ($action == 'status') {
        // Toggle Top11 status
        $currentStatus = $top11Model->getStatus();
        $success = $top11Model->toggleStatus($currentStatus);
        
        if ($success) {
            $newStatus = $currentStatus == 'open' ? 'closed' : 'opened';
            echo "<div class=\"center\"><h2>You have <span class=\"success\">" . $newStatus . "</span> Top 11 voting</h2></div>";
        } else {
            echo "<div class=\"alert alert-error\">Error changing Top11 status</div>";
        }
      } else {
      echo '<ul>
        <li><a href="top11_operations.php?action=stats">See Top 11 Stats</a></li>
        <li><a href="top11_operations.php?action=write_ins">See Top 11 Write-in Votes</a></li>
        <li><a href="top11_operations.php?action=winner">Get Random Top 11 Winner</a></li>
        <li><a href="top11_operations.php?action=contestants">See All Top 11 Contestants</a></li>
        <li><a href="top11_operations.php?action=export">Export Top 11 Contestants</a></li>
        <li><a href="top11_operations.php?action=nuke" onClick="return confirm(\'Are you sure you want to Nuke the Top 11 Data?\')">Nuke Top 11 Stats, Write-ins, Contestants & IP Addresses</a></li>
        <li><a href="top11_operations.php?action=status">Top 11 is currently <b>' . $top11Model->getStatus() .'</b> (click to change)</a></li>
      </ul>';
      }
      if ($action != '')
        echo "<p>\n<a href=\"top11_operations.php\">Top 11 Operations</a>";
  ?>
  <p>
  <a href="index.php">Control Panel</a>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>

