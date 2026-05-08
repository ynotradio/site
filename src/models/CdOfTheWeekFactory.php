<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/CdOfTheWeek.php';
require_once __DIR__ . '/implementations/SqlCdOfTheWeek.php';
require_once __DIR__ . '/implementations/PostgresCdOfTheWeek.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlCdOfTheWeek;
use YNotRadio\Models\Implementations\PostgresCdOfTheWeek;
use YNotRadio\Lib\Database;

class CdOfTheWeekFactory {
    public static function create($db) {
        // use_new_cd_of_the_week and use_postgres_cdoftheweek both mean
        // "use the Postgres/Payload implementation" — the GraphQL path was
        // never implemented and has been removed.
        $usePostgres = FeatureManager::isEnabled('use_postgres_cdoftheweek')
            || FeatureManager::isEnabled('use_new_cd_of_the_week');

        if ($usePostgres) {
            try {
                $pgDb = Database::getPostgres();
                return new PostgresCdOfTheWeek($pgDb);
            } catch (\PDOException $e) {
                error_log("CdOfTheWeekFactory: PostgreSQL connection failed, falling back to MySQL: " . $e->getMessage());
                return new SqlCdOfTheWeek($db);
            }
        }

        return new SqlCdOfTheWeek($db);
    }
} 