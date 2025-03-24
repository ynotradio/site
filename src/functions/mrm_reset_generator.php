<?php
/**
 * Modern Rock Madness Database Reset Generator
 * 
 * This script generates a SQL file to:
 * 1. Truncate the mrm_bands, mrm_matches, and mrm_votes tables
 * 2. Insert new mrm_matches rows with the expected start_time and end_time values
 *    based on the tournament start date from _mrm_config.php
 * 
 * The script outputs the SQL directly to the browser as a downloadable file
 */

// Load configuration to get the tournament start date
require_once dirname(__FILE__) . '/../partials/_mrm_config.php';

// Function to generate the match dates
function generate_match_dates($tournament_start) {
    $start_timestamp = strtotime($tournament_start);
    $dates = [];
    
    // First Round - Left Bracket (Day 1)
    $day1 = $start_timestamp;
    $dates[1] = [date('Y-m-d 10:00:00', $day1), date('Y-m-d 10:30:00', $day1)];
    $dates[2] = [date('Y-m-d 10:30:00', $day1), date('Y-m-d 11:00:00', $day1)];
    $dates[3] = [date('Y-m-d 11:00:00', $day1), date('Y-m-d 11:30:00', $day1)];
    $dates[4] = [date('Y-m-d 11:30:00', $day1), date('Y-m-d 12:00:00', $day1)];
    $dates[5] = [date('Y-m-d 13:00:00', $day1), date('Y-m-d 13:30:00', $day1)];
    $dates[6] = [date('Y-m-d 13:30:00', $day1), date('Y-m-d 14:00:00', $day1)];
    $dates[7] = [date('Y-m-d 14:00:00', $day1), date('Y-m-d 14:30:00', $day1)];
    $dates[8] = [date('Y-m-d 14:30:00', $day1), date('Y-m-d 15:00:00', $day1)];
    
    // First Round - Left Bracket (Day 2)
    $day2 = strtotime('+1 day', $start_timestamp);
    $dates[9] = [date('Y-m-d 10:00:00', $day2), date('Y-m-d 10:30:00', $day2)];
    $dates[10] = [date('Y-m-d 10:30:00', $day2), date('Y-m-d 11:00:00', $day2)];
    $dates[11] = [date('Y-m-d 11:00:00', $day2), date('Y-m-d 11:30:00', $day2)];
    $dates[12] = [date('Y-m-d 11:30:00', $day2), date('Y-m-d 12:00:00', $day2)];
    $dates[13] = [date('Y-m-d 13:00:00', $day2), date('Y-m-d 13:30:00', $day2)];
    $dates[14] = [date('Y-m-d 13:30:00', $day2), date('Y-m-d 14:00:00', $day2)];
    $dates[15] = [date('Y-m-d 14:00:00', $day2), date('Y-m-d 14:30:00', $day2)];
    $dates[16] = [date('Y-m-d 14:30:00', $day2), date('Y-m-d 15:00:00', $day2)];
    
    // First Round - Right Bracket (Day 3)
    $day3 = strtotime('+2 days', $start_timestamp);
    $dates[17] = [date('Y-m-d 10:00:00', $day3), date('Y-m-d 10:30:00', $day3)];
    $dates[18] = [date('Y-m-d 10:30:00', $day3), date('Y-m-d 11:00:00', $day3)];
    $dates[19] = [date('Y-m-d 11:00:00', $day3), date('Y-m-d 11:30:00', $day3)];
    $dates[20] = [date('Y-m-d 11:30:00', $day3), date('Y-m-d 12:00:00', $day3)];
    $dates[21] = [date('Y-m-d 13:00:00', $day3), date('Y-m-d 13:30:00', $day3)];
    $dates[22] = [date('Y-m-d 13:30:00', $day3), date('Y-m-d 14:00:00', $day3)];
    $dates[23] = [date('Y-m-d 14:00:00', $day3), date('Y-m-d 14:30:00', $day3)];
    $dates[24] = [date('Y-m-d 14:30:00', $day3), date('Y-m-d 15:00:00', $day3)];
    
    // First Round - Right Bracket (Day 4)
    $day4 = strtotime('+3 days', $start_timestamp);
    $dates[25] = [date('Y-m-d 10:00:00', $day4), date('Y-m-d 10:30:00', $day4)];
    $dates[26] = [date('Y-m-d 10:30:00', $day4), date('Y-m-d 11:00:00', $day4)];
    $dates[27] = [date('Y-m-d 11:00:00', $day4), date('Y-m-d 11:30:00', $day4)];
    $dates[28] = [date('Y-m-d 11:30:00', $day4), date('Y-m-d 12:00:00', $day4)];
    $dates[29] = [date('Y-m-d 13:00:00', $day4), date('Y-m-d 13:30:00', $day4)];
    $dates[30] = [date('Y-m-d 13:30:00', $day4), date('Y-m-d 14:00:00', $day4)];
    $dates[31] = [date('Y-m-d 14:00:00', $day4), date('Y-m-d 14:30:00', $day4)];
    $dates[32] = [date('Y-m-d 14:30:00', $day4), date('Y-m-d 15:00:00', $day4)];
    
    // Second Round - Left Bracket (Day 8 - following Monday)
    $day8 = strtotime('+7 days', $start_timestamp);
    $dates[33] = [date('Y-m-d 10:00:00', $day8), date('Y-m-d 10:30:00', $day8)];
    $dates[34] = [date('Y-m-d 10:30:00', $day8), date('Y-m-d 11:00:00', $day8)];
    $dates[35] = [date('Y-m-d 11:00:00', $day8), date('Y-m-d 11:30:00', $day8)];
    $dates[36] = [date('Y-m-d 11:30:00', $day8), date('Y-m-d 12:00:00', $day8)];
    $dates[37] = [date('Y-m-d 13:00:00', $day8), date('Y-m-d 13:30:00', $day8)];
    $dates[38] = [date('Y-m-d 13:30:00', $day8), date('Y-m-d 14:00:00', $day8)];
    $dates[39] = [date('Y-m-d 14:00:00', $day8), date('Y-m-d 14:30:00', $day8)];
    $dates[40] = [date('Y-m-d 14:30:00', $day8), date('Y-m-d 15:00:00', $day8)];
    
    // Second Round - Right Bracket (Day 9)
    $day9 = strtotime('+8 days', $start_timestamp);
    $dates[41] = [date('Y-m-d 10:00:00', $day9), date('Y-m-d 10:30:00', $day9)];
    $dates[42] = [date('Y-m-d 10:30:00', $day9), date('Y-m-d 11:00:00', $day9)];
    $dates[43] = [date('Y-m-d 11:00:00', $day9), date('Y-m-d 11:30:00', $day9)];
    $dates[44] = [date('Y-m-d 11:30:00', $day9), date('Y-m-d 12:00:00', $day9)];
    $dates[45] = [date('Y-m-d 13:00:00', $day9), date('Y-m-d 13:30:00', $day9)];
    $dates[46] = [date('Y-m-d 13:30:00', $day9), date('Y-m-d 14:00:00', $day9)];
    $dates[47] = [date('Y-m-d 14:00:00', $day9), date('Y-m-d 14:30:00', $day9)];
    $dates[48] = [date('Y-m-d 14:30:00', $day9), date('Y-m-d 15:00:00', $day9)];
    
    // Sweet 16 (Day 10)
    $day10 = strtotime('+9 days', $start_timestamp);
    $dates[49] = [date('Y-m-d 10:00:00', $day10), date('Y-m-d 10:30:00', $day10)];
    $dates[50] = [date('Y-m-d 10:30:00', $day10), date('Y-m-d 11:00:00', $day10)];
    $dates[51] = [date('Y-m-d 11:00:00', $day10), date('Y-m-d 11:30:00', $day10)];
    $dates[52] = [date('Y-m-d 11:30:00', $day10), date('Y-m-d 12:00:00', $day10)];
    $dates[53] = [date('Y-m-d 13:00:00', $day10), date('Y-m-d 13:30:00', $day10)];
    $dates[54] = [date('Y-m-d 13:30:00', $day10), date('Y-m-d 14:00:00', $day10)];
    $dates[55] = [date('Y-m-d 14:00:00', $day10), date('Y-m-d 14:30:00', $day10)];
    $dates[56] = [date('Y-m-d 14:30:00', $day10), date('Y-m-d 15:00:00', $day10)];
    
    // Elite 8 and Final 4 (Day 11)
    $day11 = strtotime('+10 days', $start_timestamp);
    $dates[57] = [date('Y-m-d 10:00:00', $day11), date('Y-m-d 10:30:00', $day11)];
    $dates[58] = [date('Y-m-d 10:30:00', $day11), date('Y-m-d 11:00:00', $day11)];
    $dates[59] = [date('Y-m-d 11:00:00', $day11), date('Y-m-d 11:30:00', $day11)];
    $dates[60] = [date('Y-m-d 11:30:00', $day11), date('Y-m-d 12:00:00', $day11)];
    $dates[61] = [date('Y-m-d 14:00:00', $day11), date('Y-m-d 15:00:00', $day11)];
    $dates[62] = [date('Y-m-d 15:00:00', $day11), date('Y-m-d 16:00:00', $day11)];
    
    // Championship (Day 12)
    $day12 = strtotime('+11 days', $start_timestamp);
    $dates[63] = [date('Y-m-d 13:00:00', $day12), date('Y-m-d 15:00:00', $day12)];
    
    return $dates;
}

// Generate SQL content
$sql = "-- Modern Rock Madness Database Reset Script\n";
$sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
$sql .= "-- Tournament Start Date: {$madness_start_date}\n\n";

// Truncate tables
$sql .= "-- Step 1: Truncate tables\n";
$sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
$sql .= "TRUNCATE TABLE mrm_bands;\n";
$sql .= "TRUNCATE TABLE mrm_matches;\n";
$sql .= "TRUNCATE TABLE mrm_votes;\n";
$sql .= "SET FOREIGN_KEY_CHECKS = 1;\n\n";

// Generate match dates
$dates = generate_match_dates($madness_start_date);

// Insert match data
$sql .= "-- Step 2: Insert match data with proper dates\n";
$sql .= "INSERT INTO mrm_matches (id, region, band1_id, band1_votes, band2_id, band2_votes, last_updated, start_time, end_time, winner_id, show_score, sponsor, sponsor_msg) VALUES\n";

$values = [];

// First round matches (1-32) - All with band IDs 1-64
for ($i = 1; $i <= 32; $i++) {
    $region = ceil($i / 8);
    $band1_id = ($i * 2) - 1;
    $band2_id = $i * 2;
    $values[] = "({$i}, {$region}, {$band1_id}, 0, {$band2_id}, 0, NOW(), '{$dates[$i][0]}', '{$dates[$i][1]}', 0, 1, NULL, NULL)";
}

// Second round and beyond (33-63) - Start with band IDs as 0 (to be filled in during tournament)
for ($i = 33; $i <= 63; $i++) {
    if ($i <= 40) {
        $region = 1;
    } elseif ($i <= 48) {
        $region = 3;
    } elseif ($i <= 52) {
        $region = 1;
    } elseif ($i <= 56) {
        $region = 3;
    } elseif ($i <= 58) {
        $region = 1;
    } elseif ($i <= 60) {
        $region = 3;
    } elseif ($i <= 62) {
        $region = 5;
    } else {
        $region = 5;
    }
    
    // For match 63 (championship), show_score is 0 initially
    $show_score = ($i == 63) ? 0 : 1;
    
    $values[] = "({$i}, {$region}, 0, 0, 0, 0, NOW(), '{$dates[$i][0]}', '{$dates[$i][1]}', 0, {$show_score}, NULL, NULL)";
}

$sql .= implode(",\n", $values) . ";\n\n";

// Generate mrm_matches_flow data for match progression
$sql .= "-- Step 3: Ensure mrm_matches_flow table exists and has correct data\n";
$sql .= "CREATE TABLE IF NOT EXISTS `mrm_matches_flow` (
  `id` int(11) NOT NULL auto_increment,
  `old` int(11) NOT NULL,
  `new` int(11) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;\n\n";

$sql .= "TRUNCATE TABLE mrm_matches_flow;\n\n";
$sql .= "INSERT INTO mrm_matches_flow (old, new) VALUES\n";

$flow = [];

// Define the flow pattern for match progression
// First round to second round
for ($i = 1; $i <= 16; $i += 2) {
    $flow[] = "({$i}, " . (32 + ceil($i / 2)) . ")";
    $flow[] = "(" . ($i + 1) . ", " . (32 + ceil($i / 2)) . ")";
}

for ($i = 17; $i <= 32; $i += 2) {
    $flow[] = "({$i}, " . (40 + ceil(($i - 16) / 2)) . ")";
    $flow[] = "(" . ($i + 1) . ", " . (40 + ceil(($i - 16) / 2)) . ")";
}

// Second round to Sweet 16
for ($i = 33; $i <= 36; $i += 1) {
    $flow[] = "({$i}, " . (48 + ceil(($i - 32) / 2)) . ")";
}
for ($i = 37; $i <= 40; $i += 1) {
    $flow[] = "({$i}, " . (50 + ceil(($i - 36) / 2)) . ")";
}
for ($i = 41; $i <= 44; $i += 1) {
    $flow[] = "({$i}, " . (52 + ceil(($i - 40) / 2)) . ")";
}
for ($i = 45; $i <= 48; $i += 1) {
    $flow[] = "({$i}, " . (54 + ceil(($i - 44) / 2)) . ")";
}

// Sweet 16 to Elite 8
for ($i = 49; $i <= 50; $i += 1) {
    $flow[] = "({$i}, 57)";
}
for ($i = 51; $i <= 52; $i += 1) {
    $flow[] = "({$i}, 58)";
}
for ($i = 53; $i <= 54; $i += 1) {
    $flow[] = "({$i}, 59)";
}
for ($i = 55; $i <= 56; $i += 1) {
    $flow[] = "({$i}, 60)";
}

// Elite 8 to Final 4
$flow[] = "(57, 61)";
$flow[] = "(58, 61)";
$flow[] = "(59, 62)";
$flow[] = "(60, 62)";

// Final 4 to Championship
$flow[] = "(61, 63)";
$flow[] = "(62, 63)";

$sql .= implode(",\n", $flow) . ";\n\n";

$sql .= "-- Script execution complete\n";
$sql .= "-- After running this script, you need to manually import the mrm_bands data.\n";

// Set headers to prompt the browser to download the file
$filename = 'mrm_reset_' . date('Ymd_His') . '.sql';
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . strlen($sql));
header('Connection: close');

// Output the SQL content directly
echo $sql;
exit;
?>