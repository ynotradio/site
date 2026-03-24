<?php

// filepath: /workspaces/site/src/models/ModernRockMadnessFactory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/ModernRockMadness.php");
require_once(__DIR__ . "/implementations/PostgresModernRockMadness.php");
require_once(__DIR__ . "/../lib/Database.php");

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
     * @param \mysqli $db MySQL database connection (unused; kept for interface compatibility)
     * @return ModernRockMadness An implementation of the ModernRockMadness interface
     * @throws \PDOException If the PostgreSQL connection fails
     */
    public static function create(\mysqli $db): ModernRockMadness
    {
        $pgDb = Database::getPostgres();
        return new PostgresModernRockMadness($pgDb);
    }
}
