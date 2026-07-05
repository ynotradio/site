<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Schedule.php';
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/implementations/PostgresSchedule.php';
require_once __DIR__ . '/implementations/SqlSchedule.php';

use YNotRadio\Lib\Database;
use YNotRadio\Models\Implementations\PostgresSchedule;
use YNotRadio\Models\Implementations\SqlSchedule;

class ScheduleFactory {
    public static function create($db = null) {
        if ($db instanceof \mysqli) {
            return new SqlSchedule($db);
        }

        return new PostgresSchedule(Database::getPostgres());
    }
}
