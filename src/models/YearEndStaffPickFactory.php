<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/YearEndStaffPick.php';
require_once __DIR__ . '/implementations/SqlYearEndStaffPick.php';
require_once __DIR__ . '/implementations/PostgresYearEndStaffPick.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresYearEndStaffPick;
use YNotRadio\Models\Implementations\SqlYearEndStaffPick;
use YNotRadio\Lib\Database;

class YearEndStaffPickFactory {
    /**
     * The legacy /cp screens pass a MySQL connection until #933 removes them;
     * the public page reads Payload's Postgres.
     */
    public static function create($db = null) {
        if ($db instanceof \mysqli) {
            return new SqlYearEndStaffPick($db);
        }

        return new PostgresYearEndStaffPick(Database::getPostgres());
    }
}
