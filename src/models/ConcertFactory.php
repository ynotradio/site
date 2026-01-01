<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Concert.php';
require_once __DIR__ . '/implementations/SqlConcert.php';
require_once __DIR__ . '/implementations/PostgresConcert.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlConcert;
use YNotRadio\Models\Implementations\PostgresConcert;
use YNotRadio\Lib\Database;

class ConcertFactory {
    public static function create($db) {
        // Check if PostgreSQL concerts feature is enabled
        if (FeatureManager::isEnabled('use_postgres_concerts')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresConcert($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlConcert($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlConcert($db);
    }
}
