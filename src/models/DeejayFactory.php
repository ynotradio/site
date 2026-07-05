<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Deejay.php';
require_once __DIR__ . '/implementations/PostgresDeejay.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresDeejay;
use YNotRadio\Lib\Database;

class DeejayFactory {
    public static function create($db) {
        return new PostgresDeejay(Database::getPostgres());
    }
}
