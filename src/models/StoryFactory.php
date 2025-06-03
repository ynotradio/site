<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/Story.php';
require_once __DIR__ . '/implementations/SqlStory.php';

use YNotRadio\Models\Implementations\SqlStory;

class StoryFactory {
    public static function create($db) {
        return new SqlStory($db);
    }
}
