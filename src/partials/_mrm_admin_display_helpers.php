<?php
/**
 * Admin display helper functions for Modern Rock Madness
 * 
 * These functions help display tournament information in the admin panel
 */

/**
 * Display matches for a specific round
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param int $round The round number to display
 * @return void
 */
function viewMatches($mrmModel, $round)
{
    $matches = $mrmModel->getMatchesByRound($round);
    
    foreach ($matches as $match) {
        $liveMatch = ($mrmModel->getCurrentMatch()['id'] == $match['id']) ? "id=\"live_match\"" : '';
        $band1WinnerClass = $match['winner_id'] != 0 && $match['winner_id'] == $match['band1_id'] ? ' mrm_winner' : '';
        $band2WinnerClass = $match['winner_id'] != 0 && $match['winner_id'] == $match['band2_id'] ? ' mrm_winner' : '';
        
        if ($match['winner_id'] != 0 && $match['winner_id'] != $match['band1_id']) {
            $band1WinnerClass = ' mrm_loser';
        }
        
        if ($match['winner_id'] != 0 && $match['winner_id'] != $match['band2_id']) {
            $band2WinnerClass = ' mrm_loser';
        }
        
        $band1Name = getBandNameWithSeed($mrmModel, $match['band1_id']);
        $band2Name = getBandNameWithSeed($mrmModel, $match['band2_id']);
        
        echo "<table class=\"bottom-spacer_20 table-center\"" . $liveMatch . ">\n
        <tr>\n<td class='mrm_band" . $band1WinnerClass . "'>" . $band1Name . "</td>\n<td></td>\n<td class='mrm_band" . $band2WinnerClass . "'>" . $band2Name . "</td>\n</tr>\n" .
        "<tr>\n<td class='" . $band1WinnerClass . "'><img src=\"" . $mrmModel->getBandPicUrl($match['band1_id']) . "\" width=\"200px\"></td>\n<td " . timerOrVs($match) . " class='middle'> VS </td>\n<td class='" . $band2WinnerClass . "'>" . "<img src=\"" . $mrmModel->getBandPicUrl($match['band2_id']) . "\" width=\"200px\"></td>\n</tr>\n";

        echo "<tr class=\"scoreboard\">";
        adminScoreboard($mrmModel, $match);
        echo "</tr>";
        
        votingStatusMessage($mrmModel, $match);
        votingButtons($mrmModel, $match, $round);
        showCloseMatch($mrmModel, $match, $round);
        
        echo "<tr>\n<td class=\"text-right\">Start Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['start_time'])) . "</td></tr>";
        echo "<tr>\n<td class=\"text-right\">End Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['end_time'])) . "</td></tr>";

        echo "</table>\n";

        echo "<table class=\"bottom-spacer_20 table-center\"" . $liveMatch . ">\n
          <tr><td><strong>Match sponsored by: " . $match['sponsor'] . "</strong></td></tr>\n
          <tr><td>" . $match['sponsor_msg'] . "</td></tr>\n
          <tr><td><a href='mrm_manage_sponsor.php?match=" . $match['id'] . "'>Edit</a></td></tr>";
        echo "</table>\n";
    }
}

/**
 * Get timer ID or empty string for VS display
 * 
 * @param array $match The match data
 * @return string HTML ID attribute or empty string
 */
function timerOrVs($match)
{
    $currentMatch = $GLOBALS['mrmModel']->getCurrentMatch();
    return ($match['id'] == $currentMatch['id']) ? "id=\"mrm_timer\"" : '';
}

/**
 * Display voting buttons for admin panel
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @param int $round The round number
 * @return void
 */
function votingButtons($mrmModel, $match, $round)
{
    $matchStatus = $mrmModel->getMatchStatus($match['id']);

    if ($matchStatus == "running" || ($mrmModel->isMatchTied($match) && $matchStatus == "over")) {
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
}

/**
 * Display voting status message
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @return void
 */
function votingStatusMessage($mrmModel, $match)
{
    $matchStatus = $mrmModel->getMatchStatus($match['id']);
    $message = "";

    if ($matchStatus == "early") {
        $message = "Voting has not started";
    } elseif ($matchStatus == "over" && $mrmModel->isMatchTied($match)) {
        $message = "Match is over and tied - vote for the winner";
    } elseif ($matchStatus == "over" && !$mrmModel->isMatchTied($match)) {
        $message = "Voting is now over";
    }

    echo "<tr><td colspan=\"3\" class=\"voting_message\">" . $message . "</td></tr>";
}

/**
 * Display the admin scoreboard
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @return void
 */
function adminScoreboard($mrmModel, $match)
{
    $matchStatus = $mrmModel->getMatchStatus($match['id']);
    
    if ($matchStatus != 'early') {
        $band1Percentage = $mrmModel->votePercentage($match['band1_votes'], $match['band2_votes']);
        $band2Percentage = $mrmModel->votePercentage($match['band2_votes'], $match['band1_votes']);
        $band1Winner = ($match['winner_id'] == $match['band1_id']) ? ' mrm_winner' : '';
        $band2Winner = ($match['winner_id'] == $match['band2_id']) ? ' mrm_winner' : '';
        
        echo "<td id=\"band_1\" class='mrm_votes{$band1Winner}'>Votes: " . $match['band1_votes'] . " | " . $band1Percentage . " </td>\n
        <td></td>\n
        <td id=\"band_2\" class='mrm_votes{$band2Winner}'>Votes: " . $match['band2_votes'] . " | " . $band2Percentage . " </td>\n";
    }
}

/**
 * Display the close match button when applicable
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @param int $round The round number
 * @return void
 */
function showCloseMatch($mrmModel, $match, $round)
{
    $matchStatus = $mrmModel->getMatchStatus($match['id']);

    if ($matchStatus == "over" && !$mrmModel->isMatchTied($match) && $match['winner_id'] == "0") {
        echo "<tr>\n<td colspan=\"3\" class=\"center\">";
        echo "<form action=\"mrm_manage_matches.php\" method=\"post\">
        <input type=\"hidden\" name=\"action\" value =\"close\">
        <input type=\"hidden\" name=\"match\" value =\"" . $match['id'] . "\">
        <input type=\"hidden\" name=\"round\" value =\"" . $round . "\">
        <input type=\"submit\" class=\"btn-danger\" value=\"Close Match\">
        </form>\n";
        echo "</td>\n</tr>";
    }
}

/**
 * Get band name with seed for display
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param int $placement The band placement
 * @return string Band name with seed
 */
function getBandNameWithSeed($mrmModel, $placement)
{
    if ($placement == 0) {
        return "TBD";
    }
    
    $band = $mrmModel->getBandByPlacement($placement);
    if (!$band) {
        return "Unknown";
    }
    
    return "<span class='seed_size'>" . $band['seed'] . "</span> " . $band['name'];
}
