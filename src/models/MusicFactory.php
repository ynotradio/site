<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Music.php';
require_once __DIR__ . '/implementations/SqlMusic.php';
require_once __DIR__ . '/implementations/PostgresMusic.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlMusic;
use YNotRadio\Models\Implementations\PostgresMusic;
use YNotRadio\Lib\Database;

class MusicFactory {
    public static function create($db) {
        // Check if PostgreSQL music feature is enabled
        if (FeatureManager::isEnabled('use_postgres_music')) {
            // Get PostgreSQL connection and return PostgreSQL implementation
            try {
                $pgDb = Database::getPostgres();
                return new PostgresMusic($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log("PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlMusic($db);
            }
        }
        
        // Default to MySQL implementation
        return new SqlMusic($db);
    }
}
