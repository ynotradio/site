<?php
/**
 * Environment loader for Y-Not Radio
 * Loads environment variables from a .env file
 */

// Calculate the correct path to .env based on current directory
$current_dir = dirname($_SERVER['SCRIPT_FILENAME']);
$in_cp_dir = strpos($current_dir, '/cp') !== false;

// Try .env.local first (for development), then fall back to .env (for production)
$env_local_path = $in_cp_dir ? __DIR__ . '/../partials/.env.local' : __DIR__ . '/partials/.env.local';
$env_path = $in_cp_dir ? __DIR__ . '/../partials/.env' : __DIR__ . '/partials/.env';

$final_env_path = file_exists($env_local_path) ? $env_local_path : $env_path;

// Load environment variables from .env file
if (file_exists($final_env_path)) {
    $env_lines = file($final_env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($env_lines as $line) {
        // Skip comments
        if (strpos(trim($line), '//') === 0 || strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse the line
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if (preg_match('/^"(.+)"$/', $value, $matches)) {
                $value = $matches[1];
            } elseif (preg_match("/^'(.+)'$/", $value, $matches)) {
                $value = $matches[1];
            }
            
            $_ENV[$key] = $value;
        }
    }
}
?>
