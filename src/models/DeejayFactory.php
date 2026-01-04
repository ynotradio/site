<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Deejay.php';
require_once __DIR__ . '/implementations/SqlDeejay.php';
require_once __DIR__ . '/implementations/PostgresDeejay.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlDeejay;
use YNotRadio\Models\Implementations\PostgresDeejay;
use YNotRadio\Lib\Database;

class DeejayFactory {
    public static function create($db) {
        // Check if PostgreSQL deejays feature is enabled
        if (FeatureManager::isEnabled('use_postgres_deejays')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresDeejay($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlDeejay($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlDeejay($db);
    }
}
