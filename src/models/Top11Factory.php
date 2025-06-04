<?php
// filepath: /workspaces/site/src/models/Top11Factory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/Top11.php");
require_once(__DIR__ . "/implementations/SqlTop11.php");

/**
 * Factory class for creating Top11 model instances
 */
class Top11Factory
{
    /**
     * Create a new Top11 model instance
     *
     * @param \mysqli $db Database connection
     * @return Top11 An implementation of the Top11 interface
     */
    public static function create(\mysqli $db): Top11
    {
        return new \YNotRadio\Models\Implementations\SqlTop11($db);
    }
}
