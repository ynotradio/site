<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Concert.php';
require_once __DIR__ . '/implementations/PostgresConcert.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresConcert;
use YNotRadio\Lib\Database;

class ConcertFactory {
    public static function create($db) {
        return new PostgresConcert(Database::getPostgres());
    }
}
