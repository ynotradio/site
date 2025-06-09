<?php
/**
 * Partial for displaying information about the next match
 * 
 * @param \YNotRadio\Controllers\MadnessController $controller MadnessController instance
 * @param string|null $tournament_date The tournament start date
 */

// Get the next match data
$next_match = $controller->mrmModel->getNextMatch();

if (!$next_match) {
    // No upcoming matches
    return;
}

// Get band information
$band1 = $controller->mrmModel->getBandByPlacement($next_match['band1_id']);
$band2 = $controller->mrmModel->getBandByPlacement($next_match['band2_id']);

// Format the time
$start_time = new DateTime($next_match['start_time']);
$formatted_time = $start_time->format('g:i A');
$formatted_date = $start_time->format('l, F j');
?>

<div class="next-match-container top-spacer_20 center">
    <h3>Next Match: <?php echo htmlspecialchars($formatted_date); ?> at <?php echo htmlspecialchars($formatted_time); ?></h3>
    
    <div class="next-match-bands">
        <div class="next-match-band">
            <div class="band-name"><?php echo htmlspecialchars($band1['name']); ?></div>
            <div class="band-image">
                <img src="<?php echo htmlspecialchars($band1['pic_url']); ?>" alt="<?php echo htmlspecialchars($band1['name']); ?>" width="150">
            </div>
        </div>
        
        <div class="vs-container">VS</div>
        
        <div class="next-match-band">
            <div class="band-name"><?php echo htmlspecialchars($band2['name']); ?></div>
            <div class="band-image">
                <img src="<?php echo htmlspecialchars($band2['pic_url']); ?>" alt="<?php echo htmlspecialchars($band2['name']); ?>" width="150">
            </div>
        </div>
    </div>
</div>
