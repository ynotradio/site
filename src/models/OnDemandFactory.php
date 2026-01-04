<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/OnDemand.php';
require_once __DIR__ . '/implementations/SqlOnDemand.php';
require_once __DIR__ . '/implementations/PostgresOnDemand.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlOnDemand;
use YNotRadio\Models\Implementations\PostgresOnDemand;
use YNotRadio\Lib\Database;

class OnDemandFactory {
    public static function create($db) {
        // Check if PostgreSQL ondemand feature is enabled
        if (FeatureManager::isEnabled('use_postgres_ondemand')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresOnDemand($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlOnDemand($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlOnDemand($db);
    }
}
