<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Story.php';
require_once __DIR__ . '/implementations/PostgresStory.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\Implementations\PostgresStory;
use YNotRadio\Lib\Database;

class StoryFactory {
    public static function create($db) {
        return new PostgresStory(Database::getPostgres());
    }
}
