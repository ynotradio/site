<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Music.php';
require_once __DIR__ . '/implementations/SqlMusic.php';

use YNotRadio\Models\Implementations\SqlMusic;

class MusicFactory {
    public static function create($db) {
        return new SqlMusic($db);
    }
}
