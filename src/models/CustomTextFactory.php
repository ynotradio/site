<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");

class CustomTextFactory
{
    public static function create($db): CustomText
    {
        return new \YNotRadio\Models\Implementations\SqlCustomText($db);
    }
}
