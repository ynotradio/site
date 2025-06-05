<?php
// Process AJAX requests for deejay sorting

require_once("../../functions/main_fns.php");
require_once("../../models/DeejayFactory.php");
require_once("debug_log.php");

// Log incoming request
logDebugInfo("Received deejay sort request", $_POST);

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('HTTP/1.1 400 Bad Request');
    $response = ['success' => false, 'message' => 'Only POST requests are accepted'];
    logDebugInfo("Error: Invalid request method", $_SERVER['REQUEST_METHOD']);
    echo json_encode($response);
    exit;
}

// Check if we have item data
if (!isset($_POST['item'])) {
    header('HTTP/1.1 400 Bad Request');
    $response = ['success' => false, 'message' => 'No sort data provided'];
    logDebugInfo("Error: No sort data provided");
    echo json_encode($response);
    exit;
}

try {
    $db = open_db();
    $deejayModel = \YNotRadio\Models\DeejayFactory::create($db);
    
    // Process the serialized data correctly
    logDebugInfo("Raw POST data", $_POST);
    
    // When jQuery UI serializes the sortable data, it creates an array like:
    // item[]=3&item[]=1&item[]=2
    // Which PHP parses into $_POST['item'] as an array
    $itemIds = [];
    if (is_array($_POST['item'])) {
        foreach ($_POST['item'] as $value) {
            // Extract the ID from the value (which might be a string)
            $id = (int) preg_replace('/[^0-9]/', '', $value);
            if ($id > 0) {
                $itemIds[] = $id;
            }
        }
    }
    
    logDebugInfo("Processing sort order update", $itemIds);
    
    // Only proceed if we have items to sort
    if (!empty($itemIds)) {
        $result = $deejayModel->updateSortOrder($itemIds);
        
        if ($result) {
            $response = ['success' => true];
            logDebugInfo("Sort order update successful");
            echo json_encode($response);
        } else {
            header('HTTP/1.1 500 Internal Server Error');
            $response = ['success' => false, 'message' => 'Failed to update sort order'];
            logDebugInfo("Error: Failed to update sort order");
            echo json_encode($response);
        }
    } else {
        header('HTTP/1.1 400 Bad Request');
        $response = ['success' => false, 'message' => 'No valid IDs found in sort data'];
        logDebugInfo("Error: No valid IDs found", $_POST['item']);
        echo json_encode($response);
    }
} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    $response = ['success' => false, 'message' => $e->getMessage()];
    logDebugInfo("Exception: " . $e->getMessage(), $e->getTraceAsString());
    echo json_encode($response);
}
