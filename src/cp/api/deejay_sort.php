<?php
// Process AJAX requests for deejay sorting

require_once("../functions/main_fns.php");
require_once("../models/DeejayFactory.php");

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['success' => false, 'message' => 'Only POST requests are accepted']);
    exit;
}

// Check if we have item data
if (!isset($_POST['item'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['success' => false, 'message' => 'No sort data provided']);
    exit;
}

try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    $result = $deejayModel->updateSortOrder($_POST['item']);
    
    if ($result) {
        echo json_encode(['success' => true]);
    } else {
        header('HTTP/1.1 500 Internal Server Error');
        echo json_encode(['success' => false, 'message' => 'Failed to update sort order']);
    }
} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
