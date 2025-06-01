<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Deejay.php';
require_once __DIR__ . '/implementations/SqlDeejay.php';

use YNotRadio\Models\Implementations\SqlDeejay;

class DeejayFactory {
    public static function create($db) {
        return new SqlDeejay($db);
    }
}
