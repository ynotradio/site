<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/OnDemand.php';
require_once __DIR__ . '/implementations/PostgresOnDemand.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresOnDemand;
use YNotRadio\Lib\Database;

class OnDemandFactory {
    public static function create($db) {
        return new PostgresOnDemand(Database::getPostgres());
    }
}
