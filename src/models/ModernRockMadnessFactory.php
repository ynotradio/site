<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/implementations/SqlModernRockMadness.php';

/**
 * Factory class for creating ModernRockMadness instances
 */
class ModernRockMadnessFactory
{
    /**
     * Create a ModernRockMadness instance
     * 
     * @param \mysqli $db Database connection
     * @return ModernRockMadness A ModernRockMadness implementation
     */
    public static function create(\mysqli $db): ModernRockMadness
    {
        return new \YNotRadio\Models\Implementations\SqlModernRockMadness($db);
    }
}
