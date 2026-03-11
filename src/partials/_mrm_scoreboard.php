<?php
/**
 * Partial for displaying match scoreboard with vote percentages
 * 
 * @param array $match The match data
 * @param \YNotRadio\Controllers\MadnessController $controller The controller instance
 */

// Only show score if enabled for this match
if (!$match['show_score']) {
    return;
}

// Calculate vote percentages
$band1_percentage = $controller->mrmModel->calculateVotePercentage($match['band1_votes'], $match['band2_votes'], 'display');
$band2_percentage = $controller->mrmModel->calculateVotePercentage($match['band2_votes'], $match['band1_votes'], 'display');

// Get the width values for the percentage bars
$band1_width = $controller->mrmModel->calculateVotePercentage($match['band1_votes'], $match['band2_votes']);
$band2_width = $controller->mrmModel->calculateVotePercentage($match['band2_votes'], $match['band1_votes']);
?>

<mrm-scoreboard
    id="mrm_scoring"
    band1-pct="<?php echo $band1_width; ?>"
    band2-pct="<?php echo $band2_width; ?>"
    band1-label="<?php echo $band1_percentage; ?>"
    band2-label="<?php echo $band2_percentage; ?>"
    style="max-width: 880px;"
></mrm-scoreboard>
