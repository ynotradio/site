<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/CdOfTheWeek.php';
require_once __DIR__ . '/implementations/SqlCdOfTheWeek.php';
require_once __DIR__ . '/implementations/GraphQLCdOfTheWeek.php';
require_once __DIR__ . '/implementations/PostgresCdOfTheWeek.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlCdOfTheWeek;
use YNotRadio\Models\Implementations\GraphQLCdOfTheWeek;
use YNotRadio\Models\Implementations\PostgresCdOfTheWeek;
use YNotRadio\Lib\Database;

class CdOfTheWeekFactory {
    public static function create($db) {
        // Check if PostgreSQL CD of the Week feature is enabled
        if (FeatureManager::isEnabled('use_postgres_cdoftheweek')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresCdOfTheWeek($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlCdOfTheWeek($db);
            }
        }
        
        // Check for legacy GraphQL feature flag
        if (FeatureManager::isEnabled('use_new_cd_of_the_week')) {
            return new GraphQLCdOfTheWeek($db);
        }
        
        // Default to MySQL implementation
        return new SqlCdOfTheWeek($db);
    }
} 