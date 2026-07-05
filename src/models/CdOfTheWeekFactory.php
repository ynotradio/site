<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/CdOfTheWeek.php';
require_once __DIR__ . '/implementations/PostgresCdOfTheWeek.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresCdOfTheWeek;
use YNotRadio\Lib\Database;

class CdOfTheWeekFactory {
    public static function create($db) {
        return new PostgresCdOfTheWeek(Database::getPostgres());
    }
}