<?php

// filepath: /workspaces/site/src/models/ModernRockMadnessFactory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/ModernRockMadness.php");
require_once(__DIR__ . "/implementations/SqlModernRockMadness.php");
require_once(__DIR__ . "/implementations/PostgresModernRockMadness.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlModernRockMadness;
use YNotRadio\Models\Implementations\PostgresModernRockMadness;
use YNotRadio\Lib\Database;

/**
 * Factory class for creating ModernRockMadness model instances
 */
class ModernRockMadnessFactory
{
    /**
     * Create a new ModernRockMadness model instance
     *
     * @param \mysqli $db MySQL database connection (used when feature flag is off)
     * @return ModernRockMadness An implementation of the ModernRockMadness interface
     */
    public static function create(\mysqli $db): ModernRockMadness
    {
        if (FeatureManager::isEnabled('use_postgres_madness')) {
            try {
                $pgDb = Database::getPostgres();
                return new PostgresModernRockMadness($pgDb);
            } catch (\PDOException $e) {
                // Fall back to MySQL if PostgreSQL connection fails
                error_log('PostgreSQL connection failed for MRM, falling back to MySQL');
                return new SqlModernRockMadness($db);
            }
        }

        return new SqlModernRockMadness($db);
    }
}
