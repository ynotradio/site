<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/YearEndPoll.php");
require_once(__DIR__ . "/implementations/SqlYearEndPoll.php");
require_once(__DIR__ . "/implementations/PostgresYearEndPoll.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\Implementations\PostgresYearEndPoll;
use YNotRadio\Models\Implementations\SqlYearEndPoll;
use YNotRadio\Lib\Database;

class YearEndPollFactory
{
    /**
     * The legacy /cp screens pass a MySQL connection and read past polls from
     * MySQL until #933 removes them; everything else reads Payload's Postgres.
     */
    public static function create(?\mysqli $db = null): YearEndPoll
    {
        if ($db instanceof \mysqli) {
            return new SqlYearEndPoll($db);
        }

        return new PostgresYearEndPoll(Database::getPostgres());
    }
}
