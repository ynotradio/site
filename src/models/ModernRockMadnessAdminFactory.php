<?php

// filepath: /workspaces/site/src/models/ModernRockMadnessAdminFactory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/ModernRockMadnessAdmin.php");
require_once(__DIR__ . "/implementations/SqlModernRockMadnessAdmin.php");

/**
 * Factory class for creating ModernRockMadnessAdmin model instances
 */
class ModernRockMadnessAdminFactory
{
    /**
     * Create a new ModernRockMadnessAdmin model instance
     *
     * @param \mysqli $db Database connection
     * @return ModernRockMadnessAdmin An implementation of the ModernRockMadnessAdmin interface
     */
    public static function create(\mysqli $db): ModernRockMadnessAdmin
    {
        return new \YNotRadio\Models\Implementations\SqlModernRockMadnessAdmin($db);
    }
}
