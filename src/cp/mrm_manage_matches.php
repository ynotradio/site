<?php

$page_file = "mrm_manage_matches.php";
$page_title = "Modern Rock Madness Matches";

require ("../functions/main_fns.php");
require ("../models/ModernRockMadnessFactory.php");
require ("../partials/_header.php");

$db = open_db();
$mrmModel = \YNotRadio\Models\ModernRockMadnessFactory::create($db);

$action = (empty($_POST['action'])) ? 'view' : $_POST['action'];

$round = (empty($_POST['round'])) ? 1 : $_POST['round'];
$round = (empty($_GET['round'])) ? $round : $_GET['round'];

$match = $_POST['match'];
$band = $_POST['band'];

if (!$_SESSION["logged_in"]) {
  login_prompt($_POST['username'],$_POST['remember_me'],$_SESSION["error"]);
} else {

/*----- CONTENT ------*/
?>
<script type='text/javascript'>
  // Initialize AdminMadness automatically when document is ready
</script>

<div class="row">
  <div class="tweleve columns content full-width">
    <h1>Modern Rock Madness Matches</h1>
		<form action="mrm_manage_matches.php" method="get">
    <?php
      $current_match = $mrmModel->getCurrentMatch();
      if ($current_match && $current_match['id'] != '8888') {
        $countdown = $mrmModel->getCountdownValues($current_match['id']);
        echo "<div class=\"hidden\" id=\"hr\">" . $countdown['hr'] . "</div>";
        echo "<div class=\"hidden\" id=\"min\">" . $countdown['min'] . "</div>";
        echo "<div class=\"hidden\" id=\"sec\">" . $countdown['sec'] . "</div>";
      }
    ?>
		<center>Select a round:
			<select name="round" onchange="javascript:this.form.submit();">
      <?php
        $rounds = array();
			  for ($i=1; $i<=6; $i++) { array_push($rounds, $i); }
												
        foreach ($rounds as $roundvalue) {
          if ($roundvalue == $round)
            echo '<option value="'.$roundvalue.'" selected="'.$roundvalue.'"> Round '.$roundvalue.'</option>'. "\n";
          else
            echo '<option value="'.$roundvalue.'"> Round '.$roundvalue.'</option>'. "\n";
			} ?>
			</select>
		</center>
		<br>
			</form>
<?php 			
        echo "<div class=\"center\"><strong>Round " . $round . "</strong></div>";

	if ($action == "view") {
		$matches = $mrmModel->getMatchesForRound($round);
    if (!empty($matches)) {
      foreach ($matches as $match) {
        $live_match = ($mrmModel->isCurrentMatch($match)) ? "id=\"live_match\"" : '';
        echo "<table class=\"bottom-spacer_20 table-center\"" . $live_match . ">\n
          <tr>\n<td class='mrm_band" . $mrmModel->getWinnerClass($match['band1_id'], $match["id"]) . "'>" . $mrmModel->getBandName($match['band1_id']) . "</td>\n<td></td>\n<td class='mrm_band" . $mrmModel->getWinnerClass($match['band2_id'], $match["id"]) . "'>" . $mrmModel->getBandName($match['band2_id']) . "</td>\n</tr>\n" .
            "<tr>\n<td class='" . $mrmModel->getWinnerClass($match['band1_id'], $match["id"]) . "'><img src=\"" . $mrmModel->getBandPicUrl($match['band1_id']) . "\" width=\"200px\"></td>\n<td " . $mrmModel->getTimerOrVs($match) . " class='middle'> VS </td>\n<td class='" . $mrmModel->getWinnerClass($match['band2_id'], $match["id"]) . "'>" . "<img src=\"" . $mrmModel->getBandPicUrl($match['band2_id']) . "\" width=\"200px\"></td>\n</tr>\n";

        echo "<tr class=\"scoreboard\">";
        echo $mrmModel->adminScoreboard($match);
        echo "</tr>";
        
        echo "<tr><td colspan=\"3\" class=\"voting_message\">" . $mrmModel->getVotingStatusMessage($match) . "</td></tr>";
        
        // Voting buttons
        if ($mrmModel->isOpenMatch($match)) {
          echo "<tr>";
          for ($i = 1; $i <= 2; $i++) {
              echo "<td class=\"center\">
          <form action=\"mrm_manage_matches.php\" class=\"for_band" . $i . "\" method=\"post\">
            <input type=\"hidden\" id=\"action\" name=\"action\" value =\"write\">
            <input type=\"hidden\" id=\"match\" name=\"match\" value =\"" . $match['id'] . "\">
            <input type=\"hidden\" id=\"band\" name=\"band\" value =\"" . $i . "\">
            <input type=\"hidden\" id=\"round\" name=\"round\" value =\"" . $round . "\">
            <input type=\"submit\" class=\"vote_for_band" . $i . " btn-success\" value=\"Manual Vote\">
            </form>\n<td>";
          }
          echo "</tr>";
        }
        
        // Close match button
        $match_status = $mrmModel->getMatchStatus($match['id']);
        if ($match_status == "over" && !$mrmModel->matchIsTied($match) && $match['winner_id'] == "0") {
          echo "<tr>\n<td colspan=\"3\" class=\"center\">";
          echo "<form action=\"mrm_manage_matches.php\" method=\"post\">
          <input type=\"hidden\" name=\"action\" value =\"close\">
          <input type=\"hidden\" name=\"match\" value =\"" . $match['id'] . "\">
          <input type=\"hidden\" name=\"round\" value =\"" . $round . "\">
          <input type=\"submit\" class=\"btn-danger\" value=\"Close Match\">
          </form>\n";
          echo "</td>\n</tr>";
        }
        
        echo "<tr>\n<td class=\"text-right\">Start Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['start_time'])) . "</td></tr>";
        echo "<tr>\n<td class=\"text-right\">End Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['end_time'])) . "</td></tr>";

        echo "</table>\n";

        echo "<table class=\"bottom-spacer_20 table-center\"" . $live_match . ">\n
              <tr><td><strong>Match sponsored by: " . $match['sponsor'] . "</strong></td></tr>\n
              <tr><td>" . $match['sponsor_msg'] . "</td></tr>\n
              <tr><td><a href='/mrm_manage_sponsor.php?match=" . $match['id'] . "'>Edit</a></td></tr>";
        echo "</table>\n";
      }
    }
	} elseif ($action == "write") {
		$mrmModel->vote($match, $band, true, $round);
    // Redirect to view after voting
    header("Location: mrm_manage_matches.php?round=" . $round);
	} elseif ($action == "close") {
		$mrmModel->closeMatch($match, $round);
    // Redirect to view after closing
    header("Location: mrm_manage_matches.php?round=" . $round);
	}

?>
  </div>
</div> <!-- end of row div -->
<?php }
  require ("../partials/_footer.php");
?>
