<?php

/**
 * PHPUnit bootstrap file
 * 
 * Sets up autoloading and test environment for unit tests.
 */

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables for testing
// Note: __env_loader.php loads .env file if it exists
require_once __DIR__ . '/../__env_loader.php';

// Set timezone for consistent test results
date_default_timezone_set('America/New_York');

// Prevent output during tests (unless debugging)
if (!defined('PHPUNIT_RUNNING')) {
    define('PHPUNIT_RUNNING', true);
}
