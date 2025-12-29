<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/Concert.php';
require_once __DIR__ . '/implementations/SqlConcert.php';

use YNotRadio\Models\Implementations\SqlConcert;

class ConcertFactory {
    public static function create($db) {
        return new SqlConcert($db);
    }
}
