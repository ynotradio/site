<?php
/**
 * Partial for displaying countdown values for an active match
 * 
 * @param array $match The match data with end_time
 */

// Calculate time difference
$now = new DateTime();
$end_time = new DateTime($match['end_time']);
$interval = $now->diff($end_time);

// Only show values if match hasn't ended
if ($now < $end_time) {
    echo "<div class=\"hidden\" id=\"hr\">" . $interval->h . "</div>\n";
    echo "<div class=\"hidden\" id=\"min\">" . $interval->i . "</div>\n";
    echo "<div class=\"hidden\" id=\"sec\">" . $interval->s . "</div>\n";
} else {
    // Match has ended
    echo "<div class=\"hidden\" id=\"hr\">0</div>\n";
    echo "<div class=\"hidden\" id=\"min\">0</div>\n";
    echo "<div class=\"hidden\" id=\"sec\">0</div>\n";
}
