<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Schedule.php';
require_once __DIR__ . '/implementations/SqlSchedule.php';

use YNotRadio\Models\Implementations\SqlSchedule;

class ScheduleFactory {
    public static function create($db) {
        return new SqlSchedule($db);
    }
}
