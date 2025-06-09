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

<table id="mrm_scoring" border="0">
    <tr>
        <td id="band1_score"><?php echo $band1_percentage; ?></td>
        <td id="band1_value" width="<?php echo $band1_width; ?>"></td>
        <td id="band2_value" width="<?php echo $band2_width; ?>"></td>
        <td id="band2_score"><?php echo $band2_percentage; ?></td>
    </tr>
</table>

<script type="text/javascript">
    $('.live_match > dl .band1 .percentage').text("<?php echo $band1_width; ?>");
    $('.live_match > dl .band2 .percentage').text("<?php echo $band2_width; ?>");
</script>
