<?php
require "functions/main_fns.php";
require "functions/mrm_fns.php";

// Test the get_tournament_dates function with different start dates
echo "<h1>Testing Tournament Date Generation</h1>";

$test_dates = [
    '2025-03-24', // Monday
    '2025-03-26', // Wednesday (should adjust to next Monday)
    '2025-04-01', // Tuesday (should adjust to next Monday)
];

foreach ($test_dates as $date) {
    echo "<h2>Start Date: $date</h2>";
    echo "<pre>";
    
    // Get the dates
    $dates = get_tournament_dates($date);
    
    // Print the dates
    echo "First Round (Left): " . $dates['first_round_left'] . "\n";
    echo "First Round (Right): " . $dates['first_round_right'] . "\n";
    echo "Second Round (Left): " . $dates['second_round_left'] . "\n";
    echo "Second Round (Right): " . $dates['second_round_right'] . "\n";
    echo "Sweet 16: " . $dates['sweet_16'] . "\n";
    echo "Elusive 8: " . $dates['elusive_8'] . "\n";
    echo "Final 4: " . $dates['final_4'] . "\n";
    echo "Championship: " . $dates['championship'] . "\n";
    
    echo "</pre>";
    
    // Test the display function
    echo "<h3>Timeline Display:</h3>";
    display_first_row($date);
}
?>