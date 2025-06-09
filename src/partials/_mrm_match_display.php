<?php
/**
 * Partial for displaying the current match with vote buttons
 * 
 * @param int $match_id The match ID to display
 * @param string|null $tournament_date The tournament start date
 * @param \YNotRadio\Controllers\MadnessController $controller MadnessController instance
 */

// Get the match data
$match = $controller->mrmModel->getMatch($match_id);

if (!$match || $match['id'] == 8888) {
    // No current match
    return;
}

// Band data
$band1 = $controller->mrmModel->getBandByPlacement($match['band1_id']);
$band2 = $controller->mrmModel->getBandByPlacement($match['band2_id']);

// Match status
$match_status = $controller->mrmModel->getMatchStatus($match_id);
$show_results = ($match_status === 'over' || $match['show_score']);

// Calculate vote percentages for display
$band1_percentage = $controller->mrmModel->calculateVotePercentage(
    $match['band1_votes'], 
    $match['band2_votes'],
    $show_results ? 'display' : 'none'
);

$band2_percentage = $controller->mrmModel->calculateVotePercentage(
    $match['band2_votes'], 
    $match['band1_votes'], 
    $show_results ? 'display' : 'none'
);

// Add timer ID for current matches
$is_current_match = ($match_status === 'running');
$timer_attr = $is_current_match ? 'id="mrm_timer"' : '';

// Check if user has already voted
$has_voted = $controller->hasVoted($match_id);
?>

<div class="mrm-match">
    <table class="mrm-match-table" <?php echo $timer_attr; ?>>
        <tr>
            <th colspan="3" class="center">
                <?php if ($is_current_match): ?>
                    <div class="match-timer">
                        Time Remaining:
                        <span class="countdown-value" id="hours">--</span>:<span class="countdown-value" id="minutes">--</span>:<span class="countdown-value" id="seconds">--</span>
                    </div>
                    <?php // Add hidden countdown values for JavaScript
                    if ($is_current_match):
                        $end_time = new DateTime($match['end_time']);
                        $now = new DateTime();
                        $interval = $now->diff($end_time);
                        echo '<div class="hidden" id="hr">' . $interval->h . '</div>';
                        echo '<div class="hidden" id="min">' . $interval->i . '</div>';
                        echo '<div class="hidden" id="sec">' . $interval->s . '</div>';
                    endif;
                    ?>
                <?php else: ?>
                    vs
                <?php endif; ?>
            </th>
        </tr>
        
        <tr>
            <td class="center band-cell">
                <div class="band-name"><?php echo htmlspecialchars($band1['name']); ?></div>
                <div class="band-image">
                    <img src="<?php echo htmlspecialchars($band1['pic_url']); ?>" alt="<?php echo htmlspecialchars($band1['name']); ?>">
                </div>
                <?php if ($show_results): ?>
                    <div class="vote-percentage"><?php echo $band1_percentage; ?></div>
                <?php endif; ?>
                
                <?php if ($match_status === 'running' && !$has_voted): ?>
                    <div class="vote-button">
                        <?php echo $controller->renderVoteForm($match_id, 1); ?>
                    </div>
                <?php endif; ?>
            </td>
            
            <td class="center vs-cell">VS</td>
            
            <td class="center band-cell">
                <div class="band-name"><?php echo htmlspecialchars($band2['name']); ?></div>
                <div class="band-image">
                    <img src="<?php echo htmlspecialchars($band2['pic_url']); ?>" alt="<?php echo htmlspecialchars($band2['name']); ?>">
                </div>
                <?php if ($show_results): ?>
                    <div class="vote-percentage"><?php echo $band2_percentage; ?></div>
                <?php endif; ?>
                
                <?php if ($match_status === 'running' && !$has_voted): ?>
                    <div class="vote-button">
                        <?php echo $controller->renderVoteForm($match_id, 2); ?>
                    </div>
                <?php endif; ?>
            </td>
        </tr>
        
        <?php if ($match_status !== 'running'): ?>
            <tr>
                <td colspan="3" class="voting-message center">
                    <?php 
                    if ($match_status === 'early') {
                        echo 'Voting has not started yet';
                    } elseif ($match_status === 'over' && $controller->isMatchTied($match)) {
                        echo 'Match is over and tied - vote for the winner';
                    } elseif ($match_status === 'over') {
                        echo 'Voting is now over';
                    }
                    ?>
                </td>
            </tr>
        <?php endif; ?>
        
        <?php if ($match['sponsor']): ?>
            <tr>
                <td colspan="3" class="sponsor-info center">
                    <strong>Match sponsored by: <?php echo htmlspecialchars($match['sponsor']); ?></strong>
                    <div><?php echo htmlspecialchars($match['sponsor_msg'] ?? ''); ?></div>
                </td>
            </tr>
        <?php endif; ?>
    </table>
</div>
