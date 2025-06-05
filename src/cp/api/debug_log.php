<?php
// Debug log for deejay_sort.php
// This file records API requests and responses for debugging

function logDebugInfo($message, $data = null) {
    $logFile = __DIR__ . '/deejay_sort_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    
    if ($data !== null) {
        $logEntry .= "Data: " . print_r($data, true) . "\n";
    }
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}
