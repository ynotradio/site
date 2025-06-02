<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");

/**
 * Factory class for creating CustomText instances
 */
class CustomTextFactory
{
    /**
     * Create a CustomText instance
     *
     * @param mixed $db Database connection
     * @return CustomText A CustomText implementation
     */
    public static function create($db): CustomText
    {
        return new \YNotRadio\Models\Implementations\SqlCustomText($db);
    }
}
