<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Schedule.php';
require_once __DIR__ . '/implementations/SqlSchedule.php';
require_once __DIR__ . '/implementations/PostgresSchedule.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlSchedule;
use YNotRadio\Models\Implementations\PostgresSchedule;
use YNotRadio\Lib\Database;

class ScheduleFactory {
    public static function create($db) {
        // Check if PostgreSQL schedule feature is enabled
        if (FeatureManager::isEnabled('use_postgres_schedule')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresSchedule($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlSchedule($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlSchedule($db);
    }
}
