<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/YearEndStaffPick.php';
require_once __DIR__ . '/implementations/SqlYearEndStaffPick.php';

use YNotRadio\Models\Implementations\SqlYearEndStaffPick;

class YearEndStaffPickFactory {
    public static function create($db) {
        return new SqlYearEndStaffPick($db);
    }
}
