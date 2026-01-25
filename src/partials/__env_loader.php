<?php

// Read .env file from htdocs root (one level up from src/)
// On production server: ~/htdocs/.env (deployed from .env.php)
// In local development: repository_root/.env.local (fallback)

$env_path = __DIR__ . '/../.env';
$env_local_path = __DIR__ . '/../.env.local';

// Use .env.local if it exists (for local development), otherwise use .env (production)
$final_env_path = file_exists($env_local_path) ? $env_local_path : $env_path;

if (file_exists($final_env_path)) {
    $env_lines = file($final_env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($env_lines as $line) {
        // Skip comments
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0 || strpos($line, '//') === 0) {
            continue;
        }
        
        // Parse key=value pairs
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            if (preg_match('/^(["\'])(.*)\\1$/', $value, $matches)) {
                $value = $matches[2];
            }
            
            $_ENV[$key] = $value;
            putenv("$key=$value");  // Make available to getenv() as well
        }
    }
}


