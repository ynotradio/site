<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/ModernRockMadness.php';
require_once __DIR__ . '/implementations/SqlModernRockMadness.php';

use YNotRadio\Models\Implementations\SqlModernRockMadness;
use mysqli;

class ModernRockMadnessFactory
{
    public static function create(mysqli $db): ModernRockMadness
    {
        return new SqlModernRockMadness($db);
    }
}
