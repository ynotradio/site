<?php
/**
 * Partial for displaying the next upcoming match.
 *
 * Renders a compact, right-aligned one-liner that matches the legacy layout:
 *   Next Match: (3) Band A vs (6) Band B | Tomorrow at 10:00 PM EDT
 *
 * @param \YNotRadio\Controllers\MadnessController $controller
 */

$next_match = $controller->mrmModel->getNextMatch();

if (!$next_match) {
    return;
}

$band1 = $controller->mrmModel->getBandByPlacement($next_match['band1_id']);
$band2 = $controller->mrmModel->getBandByPlacement($next_match['band2_id']);

$eastern = new DateTimeZone('America/New_York');
$start_time = new DateTime($next_match['start_time'], new DateTimeZone('UTC'));
$start_time->setTimezone($eastern);

// "Tomorrow at", a specific date, or just the time if it's today
$now_eastern = new DateTime('now', $eastern);
$today    = $now_eastern->format('Ymd');
$tomorrow = (clone $now_eastern)->modify('+1 day')->format('Ymd');
$match_day = $start_time->format('Ymd');

if ($match_day === $today) {
    $when = '';
} elseif ($match_day === $tomorrow) {
    $when = 'Tomorrow at ';
} else {
    $when = $start_time->format('n/j ');
}

$tz_abbr = $start_time->format('T'); // EDT or EST depending on DST
$formatted_time = $start_time->format('g:i A') . ' ' . $tz_abbr;
?>

<div class="mrm-next-match">
    <span>Next Match: </span><span class="seed_size">(<?php echo (int)$band1['seed']; ?>)</span> <?php echo htmlspecialchars($band1['name']); ?> vs <span class="seed_size">(<?php echo (int)$band2['seed']; ?>)</span> <?php echo htmlspecialchars($band2['name']); ?> | <?php echo $when . $formatted_time; ?>
</div>
