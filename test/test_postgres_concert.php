#!/usr/bin/env php
<?php
/**
 * Integration test for PostgreSQL Concert Model
 * 
 * This script tests the PostgreSQL concert implementation to ensure:
 * 1. Database connection works
 * 2. Data format matches MySQL implementation
 * 3. Feature flag works correctly
 * 4. Fallback to MySQL works when PostgreSQL fails
 * 
 * Usage: php test_postgres_concert.php
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load dependencies
require_once __DIR__ . '/../src/functions/main_fns.php';
require_once __DIR__ . '/../src/models/ConcertFactory.php';
require_once __DIR__ . '/../src/lib/Database.php';

use YNotRadio\Models\ConcertFactory;
use YNotRadio\Lib\Database;

echo "=== PostgreSQL Concert Model Integration Test ===\n\n";

// Test 1: Database Connection
echo "Test 1: PostgreSQL Connection\n";
try {
    $pgDb = Database::getPostgres();
    echo "✓ PostgreSQL connection successful\n";
    $connected = true;
} catch (PDOException $e) {
    echo "✗ PostgreSQL connection failed: " . $e->getMessage() . "\n";
    echo "  (This is expected if PostgreSQL env vars are not set)\n";
    $connected = false;
}
echo "\n";

// Test 2: MySQL Connection (baseline)
echo "Test 2: MySQL Connection (baseline)\n";
try {
    $mysqlDb = open_db();
    echo "✓ MySQL connection successful\n";
} catch (Exception $e) {
    echo "✗ MySQL connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
echo "\n";

// Test 3: Get MySQL concerts (baseline)
echo "Test 3: Get concerts from MySQL\n";
$mysqlModel = new \YNotRadio\Models\Implementations\SqlConcert($mysqlDb);
$mysqlConcerts = $mysqlModel->getUpcoming(5);
echo "✓ Retrieved " . count($mysqlConcerts) . " upcoming concerts from MySQL\n";
if (count($mysqlConcerts) > 0) {
    $sample = $mysqlConcerts[0];
    echo "  Sample concert: " . $sample['artist'] . " at " . $sample['venue'] . "\n";
    echo "  Date: " . $sample['date'] . "\n";
    echo "  Fields: " . implode(', ', array_keys($sample)) . "\n";
}
echo "\n";

// Test 4: Get PostgreSQL concerts (if connected)
if ($connected) {
    echo "Test 4: Get concerts from PostgreSQL\n";
    try {
        $pgModel = new \YNotRadio\Models\Implementations\PostgresConcert($pgDb);
        $pgConcerts = $pgModel->getUpcoming(5);
        echo "✓ Retrieved " . count($pgConcerts) . " upcoming concerts from PostgreSQL\n";
        
        if (count($pgConcerts) > 0) {
            $sample = $pgConcerts[0];
            echo "  Sample concert: " . $sample['artist'] . " at " . $sample['venue'] . "\n";
            echo "  Date: " . $sample['date'] . "\n";
            echo "  Fields: " . implode(', ', array_keys($sample)) . "\n";
            
            // Verify data format matches MySQL
            $mysqlKeys = array_keys($mysqlConcerts[0]);
            $pgKeys = array_keys($pgConcerts[0]);
            
            $missingKeys = array_diff($mysqlKeys, $pgKeys);
            if (empty($missingKeys)) {
                echo "✓ Data format matches MySQL schema\n";
            } else {
                echo "✗ Missing keys in PostgreSQL data: " . implode(', ', $missingKeys) . "\n";
            }
        } else {
            echo "  Note: No concerts in PostgreSQL database (may need migration)\n";
        }
    } catch (Exception $e) {
        echo "✗ PostgreSQL query failed: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

// Test 5: Factory without feature flag (should use MySQL)
echo "Test 5: Factory without feature flag\n";
$model1 = ConcertFactory::create($mysqlDb);
$className1 = get_class($model1);
if ($className1 === 'YNotRadio\Models\Implementations\SqlConcert') {
    echo "✓ Factory returns SqlConcert (MySQL) by default\n";
} else {
    echo "✗ Factory returned: " . $className1 . "\n";
}
echo "\n";

// Test 6: Factory with feature flag (should use PostgreSQL if available)
echo "Test 6: Factory with feature flag enabled\n";
// Simulate feature flag being enabled
$_ENV['use_postgres_concerts'] = true;

// Clear the static cache in FeatureManager if it exists
if (class_exists('YNotRadio\Models\FeatureManager')) {
    $reflection = new ReflectionClass('YNotRadio\Models\FeatureManager');
    if ($reflection->hasProperty('features')) {
        $prop = $reflection->getProperty('features');
        $prop->setAccessible(true);
        $prop->setValue(null, null);
    }
}

// Temporarily set feature flag in config
$configPath = __DIR__ . '/../src/config/features.php';
$originalConfig = file_get_contents($configPath);
$testConfig = str_replace("'use_postgres_concerts' => false", "'use_postgres_concerts' => true", $originalConfig);
file_put_contents($configPath, $testConfig);

$model2 = ConcertFactory::create($mysqlDb);
$className2 = get_class($model2);

// Restore original config
file_put_contents($configPath, $originalConfig);

if ($connected && $className2 === 'YNotRadio\Models\Implementations\PostgresConcert') {
    echo "✓ Factory returns PostgresConcert when feature flag enabled\n";
} elseif (!$connected && $className2 === 'YNotRadio\Models\Implementations\SqlConcert') {
    echo "✓ Factory falls back to SqlConcert when PostgreSQL unavailable\n";
} else {
    echo "✗ Factory returned: " . $className2 . "\n";
}
echo "\n";

// Test 7: Read-only validation
if ($connected) {
    echo "Test 7: Verify read-only operations\n";
    try {
        $pgModel = new \YNotRadio\Models\Implementations\PostgresConcert($pgDb);
        
        // Try to add (should throw exception)
        try {
            $pgModel->add(['date' => '2025-01-01', 'artist' => 'Test', 'venue' => 'Test']);
            echo "✗ Add operation did not throw exception\n";
        } catch (RuntimeException $e) {
            echo "✓ Add operation correctly throws read-only exception\n";
        }
        
        // Try to update (should throw exception)
        try {
            $pgModel->update(1, ['artist' => 'Test']);
            echo "✗ Update operation did not throw exception\n";
        } catch (RuntimeException $e) {
            echo "✓ Update operation correctly throws read-only exception\n";
        }
        
        // Try to delete (should throw exception)
        try {
            $pgModel->delete(1);
            echo "✗ Delete operation did not throw exception\n";
        } catch (RuntimeException $e) {
            echo "✓ Delete operation correctly throws read-only exception\n";
        }
    } catch (Exception $e) {
        echo "✗ Read-only test failed: " . $e->getMessage() . "\n";
    }
    echo "\n";
}

// Summary
echo "=== Test Summary ===\n";
if ($connected) {
    echo "PostgreSQL: Available and tested\n";
    echo "Next steps:\n";
    echo "  1. Verify data in PostgreSQL matches MySQL\n";
    echo "  2. Test feature flag toggling in browser\n";
    echo "  3. Monitor error logs for any issues\n";
} else {
    echo "PostgreSQL: Not available (connection failed)\n";
    echo "Next steps:\n";
    echo "  1. Configure PostgreSQL environment variables\n";
    echo "  2. Run Payload migrations to create schema\n";
    echo "  3. Re-run this test script\n";
}

echo "\nAll tests completed!\n";
