<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Story.php';
require_once __DIR__ . '/implementations/SqlStory.php';
require_once __DIR__ . '/implementations/PostgresStory.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlStory;
use YNotRadio\Models\Implementations\PostgresStory;
use YNotRadio\Lib\Database;

class StoryFactory {
    public static function create($db) {
        // Check if PostgreSQL stories feature is enabled
        if (FeatureManager::isEnabled('use_postgres_stories')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresStory($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlStory($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlStory($db);
    }
}
