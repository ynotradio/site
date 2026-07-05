<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Music.php';
require_once __DIR__ . '/implementations/PostgresMusic.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresMusic;
use YNotRadio\Lib\Database;

class MusicFactory {
    public static function create($db) {
        return new PostgresMusic(Database::getPostgres());
    }
}
