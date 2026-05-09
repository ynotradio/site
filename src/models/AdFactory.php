<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Ad.php';
require_once __DIR__ . '/implementations/PostgresAd.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresAd;
use YNotRadio\Lib\Database;

class AdFactory {
    public static function create($db) {
        return new PostgresAd(Database::getPostgres());
    }
}