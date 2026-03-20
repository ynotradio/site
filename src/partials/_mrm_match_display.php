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

<mrm-match-card
    match-id="<?php echo htmlspecialchars($match['id']); ?>"
    status="<?php echo htmlspecialchars($match_status); ?>"
    band1-name="<?php echo htmlspecialchars($band1['name']); ?>"
    band1-image="<?php echo htmlspecialchars($band1['pic_url']); ?>"
    <?php if (!empty($band1['sponsor'])): ?>
        band1-sponsor="<?php echo htmlspecialchars($band1['sponsor']); ?>"
    <?php endif; ?>
    band2-name="<?php echo htmlspecialchars($band2['name']); ?>"
    band2-image="<?php echo htmlspecialchars($band2['pic_url']); ?>"
    <?php if (!empty($band2['sponsor'])): ?>
        band2-sponsor="<?php echo htmlspecialchars($band2['sponsor']); ?>"
    <?php endif; ?>
    <?php if ($show_results): ?>
        band1-pct="<?php echo $band1_percentage; ?>"
        band2-pct="<?php echo $band2_percentage; ?>"
        show-results
    <?php endif; ?>
    <?php
    // Determine winner for loser-dimming
    $winner1 = $controller->getWinnerClass($match['band1_id'], $match['id']);
    $winner2 = $controller->getWinnerClass($match['band2_id'], $match['id']);
    if (strpos($winner1, 'mrm_winner') !== false) {
        echo 'winner="1"';
    } elseif (strpos($winner2, 'mrm_winner') !== false) {
        echo 'winner="2"';
    }
    ?>
    <?php if ($has_voted): ?>has-voted<?php endif; ?>
    <?php if ($match_status === 'over' && $controller->isMatchTied($match)): ?>tied<?php endif; ?>
    <?php
    // Auth0 login check – show login URL if not authenticated
    $auth0 = $GLOBALS['auth0'] ?? null;
    $userInfo = $auth0 ? $auth0->getUser() : null;
    $voter_email = $userInfo['email'] ?? null;
    if (empty($voter_email) && $match_status === 'running' && !$has_voted) {
        $page_url = '/' . basename($GLOBALS['page_file'] ?? 'madness.php', '.php');
        echo 'login-url="auth_login.php?returnTo=' . htmlspecialchars($page_url) . '"';
    }
    ?>
    <?php if ($match['sponsor']): ?>
        sponsor="<?php echo htmlspecialchars($match['sponsor']); ?>"
        sponsor-msg="<?php echo htmlspecialchars($match['sponsor_msg'] ?? ''); ?>"
    <?php endif; ?>
></mrm-match-card>

<?php if ($is_current_match): ?>
    <div class="hidden" id="hr"><?php
        $end_time = new DateTime($match['end_time'], new DateTimeZone('UTC'));
        $now = new DateTime('now', new DateTimeZone('UTC'));
        $interval = $now->diff($end_time);
        echo $interval->h;
    ?></div>
    <div class="hidden" id="min"><?php echo $interval->i; ?></div>
    <div class="hidden" id="sec"><?php echo $interval->s; ?></div>
<?php endif; ?>
