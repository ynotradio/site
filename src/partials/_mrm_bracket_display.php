<?php
/**
 * Partial for displaying the tournament bracket
 * 
 * @param \YNotRadio\Controllers\MadnessController $controller MadnessController instance
 * @param string|null $tournament_date The tournament start date
 */

// Get bracket matches from the model
$matches = $controller->mrmModel->getBracketMatches();

// Get tournament timeline
$timeline = $controller->mrmModel->getTimelineData($tournament_date ?? date('Y-m-d'));
?>

<div id="bracket">
    <?php for ($region = 1; $region <= 5; $region++): ?>
        <div id="region_<?php echo $region; ?>">
            <?php 
            $round_counter = 1;
            $regionMatches = $matches[$region] ?? [];
            $matchCount = count($regionMatches);
            
            for ($i = 0; $i < $matchCount; $i++): 
                $match = $regionMatches[$i];
                $matchIndex = $i + 1; // 1-based index for compatibility with original code
                
                // Open a round div at specific match indices
                if (($matchIndex == 1 || $matchIndex == 9 || $matchIndex == 13 || $matchIndex == 15) && $region < 5):
            ?>
                <div class="round<?php echo $round_counter; ?>">
            <?php 
                    $round_counter++;
                endif;
                
                // Determine side class (left/right)
                $side = '';
                if ($match['id'] == 63) {
                    $side = '';
                } elseif ($region <= 2 || $match['id'] == 62) {
                    $side = ' left';
                } else {
                    $side = ' right';
                }
                
                // Get match status
                $match_status = $controller->mrmModel->getMatchStatus($match['id']);
                $is_live = ($match_status == "running") ? ' live_match' : '';
                
                // Get band data
                $band1 = $controller->mrmModel->getBandByPlacement($match['band1_id']);
                $band2 = $controller->mrmModel->getBandByPlacement($match['band2_id']);
                
                // Get winner classes
                $winner1_class = $controller->getWinnerClass($match['band1_id'], $match['id']);
                $winner2_class = $controller->getWinnerClass($match['band2_id'], $match['id']);
            ?>
            <mrm-bracket-match
                id="match<?php echo $match['id']; ?>"
                match-id="<?php echo $match['id']; ?>"
                band1-seed="<?php echo htmlspecialchars($band1['seed']); ?>"
                band1-name="<?php echo htmlspecialchars($band1['abbr']); ?>"
                <?php if ($match['show_score']): ?>band1-pct="<?php echo $controller->mrmModel->calculateVotePercentage($match['band1_votes'], $match['band2_votes']); ?>"<?php endif; ?>
                band2-seed="<?php echo htmlspecialchars($band2['seed']); ?>"
                band2-name="<?php echo htmlspecialchars($band2['abbr']); ?>"
                <?php if ($match['show_score']): ?>band2-pct="<?php echo $controller->mrmModel->calculateVotePercentage($match['band2_votes'], $match['band1_votes']); ?>"<?php endif; ?>
                <?php echo $winner1_class ? 'winner="1"' : ''; ?><?php echo $winner2_class ? 'winner="2"' : ''; ?>
                <?php echo $is_live ? 'live' : ''; ?>
                <?php echo trim($side) ? 'side="' . trim($side) . '"' : ''; ?>
            ></mrm-bracket-match>
            
            <?php
                // Close round div at specific match indices
                if (($matchIndex == 8 || $matchIndex == 12 || $matchIndex == 14 || $matchIndex == 15) && $region < 5):
            ?>
                </div>
            <?php 
                endif;
            endfor; 
            ?>
        </div>
    <?php endfor; ?>
    
    <?php
    // Display sponsor information if available
    $sponsorInfo = $controller->getSponsorInfo();
    if ($sponsorInfo):
    ?>
        <div class="sponsor" id="sponsor_top">
            Match sponsored by<br>
            <?php echo htmlspecialchars($sponsorInfo['name']); ?>
            <?php if (!empty($sponsorInfo['message'])): ?>
                <br><?php echo htmlspecialchars($sponsorInfo['message']); ?>
            <?php endif; ?>
        </div>
        <div class="sponsor" id="sponsor_bottom">
            Match sponsored by<br>
            <?php echo htmlspecialchars($sponsorInfo['name']); ?>
            <?php if (!empty($sponsorInfo['message'])): ?>
                <br><?php echo htmlspecialchars($sponsorInfo['message']); ?>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<?php
// Display tournament timeline
echo "<ul id='time_line'>\n";

// Left side of the bracket (first to championship)
echo "<li><strong>1<sup>st</sup> ROUND</strong>{$timeline['first_round_left']}</li>\n";
echo "<li><strong>2<sup>nd</sup> ROUND</strong>{$timeline['second_round_left']}</li>\n";
echo "<li class=\"top-pad_3\"><strong>SWELL 16</strong>{$timeline['sweet_16']}</li>\n";
echo "<li class=\"top-pad_3\"><strong>ELUSIVE 8</strong>{$timeline['elusive_8']}</li>\n";
echo "<li class=\"top-pad_3\"><strong>FANTASTIC 4</strong>{$timeline['final_4']}</li>\n";

// Championship (center)
echo "<li class=\"top-pad_3\"><strong>CHAMPION</strong>{$timeline['championship']}</li>\n";

// Right side of the bracket (championship to first)
echo "<li class=\"top-pad_3\"><strong>FANTASTIC 4</strong>{$timeline['final_4']}</li>\n";
echo "<li class=\"top-pad_3\"><strong>ELUSIVE 8</strong>{$timeline['elusive_8']}</li>\n";
echo "<li class=\"top-pad_3\"><strong>SWELL 16</strong>{$timeline['sweet_16']}</li>\n";
echo "<li><strong>2<sup>nd</sup> ROUND</strong>{$timeline['second_round_right']}</li>\n";
echo "<li><strong>1<sup>st</sup> ROUND</strong>{$timeline['first_round_right']}</li>\n";

// Close the timeline
echo "</ul>\n";
?>
