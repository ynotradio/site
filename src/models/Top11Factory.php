<?php
// filepath: /workspaces/site/src/models/Top11Factory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/Top11.php");
require_once(__DIR__ . "/implementations/SqlTop11.php");
require_once(__DIR__ . "/implementations/PostgresTop11.php");
require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\Implementations\PostgresTop11;
use YNotRadio\Lib\Database;

/**
 * Factory class for creating Top11 model instances
 */
class Top11Factory
{
    /**
     * Create a new Top11 model instance
     *
     * Top11 reads/writes are flagged between MySQL and Postgres while the
     * Postgres/Payload adapter is validated. When `use_postgres_top11` is
     * enabled the visitor-facing page reads/writes Postgres; otherwise (the
     * default) it falls back to MySQL. The legacy CP admin screens
     * (top11_operations.php etc.) are superseded by Payload's Contest
     * Controls tab and are not supported by PostgresTop11 -- see its class
     * doc comment.
     *
     * @param \mysqli $db Database connection
     * @return Top11 An implementation of the Top11 interface
     */
    public static function create(\mysqli $db): Top11
    {
        if (FeatureManager::isEnabled('use_postgres_top11')) {
            return new PostgresTop11(Database::getPostgres());
        }

        return new \YNotRadio\Models\Implementations\SqlTop11($db);
    }
}
