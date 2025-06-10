<?php

// filepath: /workspaces/site/src/models/ModernRockMadnessFactory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/ModernRockMadness.php");
require_once(__DIR__ . "/implementations/SqlModernRockMadness.php");

/**
 * Factory class for creating ModernRockMadness model instances
 */
class ModernRockMadnessFactory
{
    /**
     * Create a new ModernRockMadness model instance
     *
     * @param \mysqli $db Database connection
     * @return ModernRockMadness An implementation of the ModernRockMadness interface
     */
    public static function create(\mysqli $db): ModernRockMadness
    {
        return new \YNotRadio\Models\Implementations\SqlModernRockMadness($db);
    }
}
