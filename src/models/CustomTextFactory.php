<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/PostgresCustomText.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\Implementations\PostgresCustomText;
use YNotRadio\Lib\Database;

class CustomTextFactory
{
    public static function create($db): CustomText
    {
        return new PostgresCustomText(Database::getPostgres());
    }
}
