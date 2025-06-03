<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/OnDemand.php';
require_once __DIR__ . '/implementations/SqlOnDemand.php';

use YNotRadio\Models\Implementations\SqlOnDemand;

class OnDemandFactory {
    public static function create($db) {
        return new SqlOnDemand($db);
    }
}
