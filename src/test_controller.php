<?php
require "functions/main_fns.php";
require "models/ModernRockMadnessFactory.php";
require "controllers/MadnessController.php";

echo "Testing controller creation...\n";

$db = open_db();
echo "Database connection created\n";

try {
    $madnessController = new \YNotRadio\Controllers\MadnessController($db);
    echo "Controller created successfully\n";
    
    $current_match = $madnessController->getCurrentMatch();
    echo "Current match retrieved: " . json_encode($current_match) . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>
