<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/YearEndPoll.php");
require_once(__DIR__ . "/implementations/SqlYearEndPoll.php");
require_once(__DIR__ . "/implementations/PostgresYearEndPoll.php");
require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\Implementations\PostgresYearEndPoll;
use YNotRadio\Models\Implementations\SqlYearEndPoll;
use YNotRadio\Lib\Database;

class YearEndPollFactory
{
    /**
     * Postgres when `use_postgres_yearendpoll` is on. The legacy CP screens
     * always get MySQL because FeatureManager suppresses use_postgres_* on /cp.
     */
    public static function create(?\mysqli $db = null): YearEndPoll
    {
        if (FeatureManager::isEnabled('use_postgres_yearendpoll')) {
            return new PostgresYearEndPoll(Database::getPostgres());
        }

        return new SqlYearEndPoll($db);
    }
}
