<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Story.php';
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/implementations/PostgresStory.php';
require_once __DIR__ . '/implementations/SqlStory.php';

use YNotRadio\Lib\Database;
use YNotRadio\Models\Implementations\PostgresStory;
use YNotRadio\Models\Implementations\SqlStory;

class StoryFactory {
    public static function create($db = null) {
        if ($db instanceof \mysqli) {
            return new SqlStory($db);
        }

        return new PostgresStory(Database::getPostgres());
    }
}
