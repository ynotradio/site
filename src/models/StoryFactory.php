<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Story.php';
require_once __DIR__ . '/implementations/SqlStory.php';
require_once __DIR__ . '/implementations/PostgresStory.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\PostgresStory;
use YNotRadio\Models\Implementations\SqlStory;
use YNotRadio\Lib\Database;

class StoryFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('use_postgres_stories')) {
            try {
                $pgDb = Database::getPostgres();
                return new PostgresStory($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlStory($db);
            }
        }

        return new SqlStory($db);
    }
}
