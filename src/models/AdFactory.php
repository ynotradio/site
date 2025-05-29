<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Ad.php';
require_once __DIR__ . '/implementations/SqlAd.php';

use YNotRadio\Models\Implementations\SqlAd;

class AdFactory {
    public static function create($db) {
        return new SqlAd($db);
    }
} 