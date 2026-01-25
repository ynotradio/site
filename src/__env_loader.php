<?php
/**
 * Environment loader for Y-Not Radio
 * Loads environment variables from a .env file
 * 
 * Production: Looks for .env in htdocs root (same directory)
 * Local development: Looks for .env.local in repository root
 */

// On production server: ~/htdocs/.env (deployed from .env.php)
// In local dev: repository_root/.env.local (preferred) or .env
$env_local_path = __DIR__ . '/.env.local';
$env_path = __DIR__ . '/.env';

// Prefer .env.local (development) over .env (production)
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
            putenv("$key=$value");  // Make available to getenv() as well
        }
    }
}
?>
