<?php
/**
 * Modern Rock Madness Display Helper Functions
 * 
 * This file contains helper functions for displaying Modern Rock Madness tournament
 * elements like brackets, timelines, matches, etc.
 */

/**
 * Format a timeline item for the tournament schedule
 * 
 * @param string $title The round title
 * @param string $date The formatted date string
 * @param bool $usePadding Whether to add top padding class
 * @return string HTML for the timeline item
 */
function formatTimelineItem($title, $date, $usePadding = false)
{
    $paddingClass = $usePadding ? ' class="top-pad_3"' : '';
    return "<li{$paddingClass}><strong>{$title}</strong>{$date}</li>\n";
}

/**
 * Displays the timeline for the tournament rounds
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param string $startDate Start date of the tournament in Y-m-d format (e.g. '2025-03-17')
 * @return void
 */
function displayFirstRow($mrmModel, $startDate = null)
{
    // Default to current year March 17th if no date provided
    if ($startDate === null) {
        $startDate = date('Y') . '-03-17';
    }
    
    // Get all tournament dates
    $dates = $mrmModel->getTournamentDates($startDate);
    
    // Start the timeline
    echo "<ul id='time_line'>\n";
    
    // Left side of the bracket (first to championship)
    echo formatTimelineItem("1<sup>st</sup> ROUND", $dates['first_round_left']);
    echo formatTimelineItem("2<sup>nd</sup> ROUND", $dates['second_round_left']);
    echo formatTimelineItem("SWELL 16", $dates['sweet_16'], true);
    echo formatTimelineItem("ELUSIVE 8", $dates['elusive_8'], true);
    echo formatTimelineItem("FANTASTIC 4", $dates['final_4'], true);
    
    // Championship (center)
    echo formatTimelineItem("CHAMPION", $dates['championship'], true);
    
    // Right side of the bracket (championship to first)
    echo formatTimelineItem("FANTASTIC 4", $dates['final_4'], true);
    echo formatTimelineItem("ELUSIVE 8", $dates['elusive_8'], true);
    echo formatTimelineItem("SWELL 16", $dates['sweet_16'], true);
    echo formatTimelineItem("2<sup>nd</sup> ROUND", $dates['second_round_right']);
    echo formatTimelineItem("1<sup>st</sup> ROUND", $dates['first_round_right']);
    
    // Close the timeline
    echo "</ul>\n";
}

/**
 * Display the current match and tournament status
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param int $matchId The match ID to display
 * @param string $tournamentDate Optional tournament start date in Y-m-d format
 * @return void
 */
function showMatch($mrmModel, $matchId, $tournamentDate = null)
{
    // Global tournament date to make it accessible across all functions
    global $madness_start_date;
    if ($tournamentDate === null && isset($madness_start_date)) {
        $tournamentDate = $madness_start_date;
    }

    if ($matchId != 8888) {
        $match = $mrmModel->getMatchById($matchId);
        if (!$match) {
            echo "<div class='error'>Error: Match not found</div>";
            return;
        }
        
        $matchStatus = $mrmModel->getMatchStatus($matchId);

        echo '<table id="mrm_current_match" border="0">
      <tr>
        <td> ' . getBandNameWithSeed($mrmModel, $match['band1_id']) . '<br>' . $mrmModel->getSponsorName($match['band1_id']) . '</td>
        <td></td>
        <td> ' . getBandNameWithSeed($mrmModel, $match['band2_id']) . '<br>' . $mrmModel->getSponsorName($match['band2_id']) . '</td>
      </tr>
      <tr>
        <td> <img src="' . $mrmModel->getBandPicUrl($match['band1_id']) . '"></td>
        <td class="middle" id="mrm_timer">';
        if ($matchStatus == 'over') {
            echo 'Match Over';
        }
        echo '</td>
      <td> <img src="' . $mrmModel->getBandPicUrl($match['band2_id']) . '"></td></tr>
      <tr>';
        echo "<td class=\"hidden\">";
        countdownValues($match);
        echo "</td>";
        echo "</tr>\n<tr>";
        if ($matchStatus == 'early') {
            echo '<td colspan=3 class="center">Voting has not started yet</td>';
        } elseif ($matchStatus == 'running') {
            $auth0 = $GLOBALS['auth0'];
            $userInfo = $auth0->getUser();
            $voterEmail = $userInfo['email'] ?? '';
            
            if (!$mrmModel->hasVoted($matchId, $voterEmail)) {
                echo '<td class="center">';
                voteForm($matchId, 1, $voterEmail);
                echo "</td>\n
          <td></td>\n
          <td class='center'>";
                voteForm($matchId, 2, $voterEmail);
                echo '</td>';
            } else {
                echo '<td colspan=3 class="center">Thanks for Voting!</td>';
            }
        } elseif ($matchStatus == 'over') {
            echo '<td colspan=3></td>';
        }
        echo "\n</tr>\n</table>\n";
        if ($matchStatus != "early") {
            echo '<table id="mrm_scoring" border="0">';
            displayScoreboard($mrmModel, $match);
            echo '</table>';
        }
    }

    if ($mrmModel->endOfMadness()) {
        displayWinnerBanner($mrmModel, $tournamentDate);
    } elseif ($mrmModel->waitingForFinal()) {
        echo "<div class=\"top-spacer_20 center\"><strong>Hang in there, we are still counting up all of the votes...</strong></div>";
    } else {
        displayNextMatch($mrmModel);
    }
}

/**
 * Format countdown values for JavaScript timer
 * 
 * @param array $match The match data
 * @return void
 */
function countdownValues($match)
{
    $now = new DateTime();
    $endTime = new DateTime($match['end_time']);
    $diff = $now->diff($endTime);
    
    echo "<div class=\"hidden\" id=\"hr\">" . $diff->h . "</div>
    <div class=\"hidden\" id=\"min\">" . $diff->i . "</div>
    <div class=\"hidden\" id=\"sec\">" . $diff->s . "</div>";
}

/**
 * Display voting form for a band
 * 
 * @param int $matchId The match ID
 * @param int $bandId The band number (1 or 2)
 * @param string $voterEmail The voter's email
 * @return void
 */
function voteForm($matchId, $bandId, $voterEmail)
{
    if (empty($voterEmail)) {
        echo '<a href="social_login.php" class="btn-success">Log in to vote</a>';
    } else {
        echo '<form action="madness.php" method="post">
        <input type="submit" class="btn-success" value="Vote!">
        <input type="hidden" name="match_id" value ="' . $matchId . '">
        <input type="hidden" name="band_id" value ="' . $bandId . '">
        <input type="hidden" name="voter_email" value ="' . $voterEmail . '">
        </form>';
    }
}

/**
 * Display the scoreboard for a match
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @return void
 */
function displayScoreboard($mrmModel, $match)
{
    if ($match['show_score']) {
        $band1Percentage = $mrmModel->votePercentage($match['band1_votes'], $match['band2_votes'], "display");
        $band2Percentage = $mrmModel->votePercentage($match['band2_votes'], $match['band1_votes'], "display");
        $band1Width = $mrmModel->votePercentage($match['band1_votes'], $match['band2_votes']);
        $band2Width = $mrmModel->votePercentage($match['band2_votes'], $match['band1_votes']);
        
        echo '<tr>
    <td id="band1_score">' . $band1Percentage . '</td>
    <td id="band1_value" width="' . $band1Width . '"></td>
    <td id="band2_value" width="' . $band2Width . '"></td>
    <td id="band2_score">' . $band2Percentage . '</td>
    </tr>';

        echo "<script type='text/javascript'>
    $('.live_match > dl .band1 .percentage').text(\"" . $band1Width . "\");
    $('.live_match > dl .band2 .percentage').text(\"" . $band2Width . "\");
    </script>";
    } else {
        echo "<script type='text/javascript'>
    $('.live_match > dl .band1 .percentage').text(\"" . $mrmModel->votePercentage($match['band1_votes'], $match['band2_votes']) . "\");
    $('.live_match > dl .band2 .percentage').text(\"" . $mrmModel->votePercentage($match['band2_votes'], $match['band1_votes']) . "\");
    </script>";
    }
}

/**
 * Display the next match information
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @return void
 */
function displayNextMatch($mrmModel)
{
    $nextMatch = $mrmModel->getNextMatch();
    
    if ($nextMatch) {
        echo '<div id="next_match">
      <span>Next Match: </span><span class="seed_size">(' . $mrmModel->getSeed($nextMatch['band1_id']) . ')</span> ' . 
      getBandNameWithSeed($mrmModel, $nextMatch['band1_id']) . ' vs <span class="seed_size">(' . 
      $mrmModel->getSeed($nextMatch['band2_id']) . ')</span> ' . 
      getBandNameWithSeed($mrmModel, $nextMatch['band2_id']) . ' | ';
      
        $today = date('Ymd');
        $matchDate = date('Ymd', strtotime($nextMatch['start_time']));
        
        if ($today + 1 == $matchDate) {
            echo "Tomorrow at ";
        } elseif ($today + 1 < $matchDate) {
            echo date('m/d ', strtotime($nextMatch['start_time']));
        }

        echo $nextMatch['fdate'] . ' EST</div>';
    }
}

/**
 * Display winner banner at the end of the tournament
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param string $tournamentDate Optional tournament start date in Y-m-d format
 * @return void
 */
function displayWinnerBanner($mrmModel, $tournamentDate = null)
{
    $finalMatch = $mrmModel->getMatchById(63);
    if (!$finalMatch) {
        return;
    }
    
    // Get the tournament year
    $year = $mrmModel->getTournamentYear($tournamentDate);
    $winnerName = $mrmModel->getBandName($finalMatch['winner_id']);
    $winnerPicUrl = $mrmModel->getBandPicUrl($finalMatch['winner_id']);

    echo "<div class=\"center\"><h2>Congratulations to your " . $year . " <br>Y-Not Modern Rock Madness Champions</h2><h1>" . $winnerName . "!</h1>" .
    '<img src="' . $winnerPicUrl . '" height="200px"></div>';
}

/**
 * Get band name with seed
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

/**
 * Display the entire tournament bracket
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @return void
 */
function displayBracket($mrmModel)
{
    global $db;
    echo "\n<div id=\"bracket\">";
    
    for ($r = 1; $r <= 5; $r++) {
        echo "\n<div id='region_" . $r . "'>";
        $roundCounter = 1;

        $query = "SELECT * FROM mrm_matches WHERE region = " . $r;
        $result = mysqli_query($db, $query);

        if (!$result) {
            die('Error getting bracket data.');
        }

        for ($i = 1; $i <= mysqli_num_rows($result); $i++) { //loop through all matches in region
            $match = mysqli_fetch_assoc($result);
            
            if (($i == 1 || $i == 9 || $i == 13 || $i == 15) && $r < 5) {
                echo "\n<div class='round" . $roundCounter . "'>";
                $roundCounter++;
            }
            
            if ($match['id'] == 63) {
                $side = '';
            } elseif ($r <= 2 || $match['id'] == 62) {
                $side = ' left';
            } else {
                $side = ' right';
            }

            prepareBracketMatch($mrmModel, $match, $side);
            
            if (($i == 8 || $i == 12 || $i == 14 || $i == 15) && $r < 5) {
                echo "\n</div>"; //close round div
            }
        } //end of matches loop
        
        echo "</div>"; //end of region
    } // end region for loop
    
    displaySponsor($mrmModel);
    echo "</div>"; //close bracket div
}

/**
 * Prepare a match for bracket display
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @param string $side The side class ('left', 'right', or '')
 * @return void
 */
function prepareBracketMatch($mrmModel, $match, $side)
{
    $matchClasses = 'match' . $side;
    $matchStatus = $mrmModel->getMatchStatus($match['id']);
    
    if ($matchStatus == "running") {
        $matchClasses .= ' live_match';
    }

    echo '<div class="' . $matchClasses . '" id="match' . $match['id'] . '">
    <dl>';
    
    // Display band 1
    $band1Winner = isWinner($mrmModel, $match, $match['band1_id']);
    echo '<dt class="band1' . $band1Winner . '"><span class="seed">' . $mrmModel->getSeed($match['band1_id']) . 
         "</span><span class='band_abbr'>" . $mrmModel->getBandAbbr($match['band1_id']) . "</span>";
    
    if ($match['show_score']) {
        echo "<span class='percentage'>" . 
             $mrmModel->votePercentage($match['band1_votes'], $match['band2_votes']) . 
             "</span>";
    }
    echo '</dt>';
    
    // Display band 2
    $band2Winner = isWinner($mrmModel, $match, $match['band2_id']);
    echo '<dt class="band2' . $band2Winner . '"><span class="seed">' . $mrmModel->getSeed($match['band2_id']) . 
         "</span><span class='band_abbr'>" . $mrmModel->getBandAbbr($match['band2_id']) . "</span>";
         
    if ($match['show_score']) {
        echo "<span class='percentage'>" . 
             $mrmModel->votePercentage($match['band2_votes'], $match['band1_votes']) . 
             "</span>";
    }
    echo " </dt>\n</dl>\n</div>\n";
}

/**
 * Check if a band is the winner of a match
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @param array $match The match data
 * @param int $bandId The band ID
 * @return string CSS class for winner/loser or empty string
 */
function isWinner($mrmModel, $match, $bandId)
{
    if ($match['winner_id'] == 0) {
        return '';
    }

    if ($match['winner_id'] == $bandId) {
        return ' mrm_winner';
    } else {
        return ' mrm_loser';
    }
}

/**
 * Display the match sponsor
 * 
 * @param \YNotRadio\Models\ModernRockMadness $mrmModel Model instance
 * @return void
 */
function displaySponsor($mrmModel)
{
    $currentMatch = $mrmModel->getCurrentMatch();
    if (isset($currentMatch['sponsor']) && !empty($currentMatch['sponsor'])) {
        echo "<div class=\"sponsor\" id='sponsor_top'>\n" .
            "Match sponsored by\n" .
            "<br>\n" . $currentMatch['sponsor'];
        if (isset($currentMatch['sponsor_msg']) && !empty($currentMatch['sponsor_msg'])) {
            echo "<br>\n" . $currentMatch['sponsor_msg'];
        }
        echo "</div>\n";
        
        echo "<div class=\"sponsor\" id='sponsor_bottom'>\n" .
            "Match sponsored by\n" .
            "<br>\n" . $currentMatch['sponsor'];
        if (isset($currentMatch['sponsor_msg']) && !empty($currentMatch['sponsor_msg'])) {
            echo "<br>\n" . $currentMatch['sponsor_msg'];
        }
        echo "</div>\n";
    }
}
