<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");
require_once(__DIR__ . "/implementations/PostgresCustomText.php");
require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\FeatureManager;
use YNotRadio\Lib\Database;

class CustomTextFactory
{
    public static function create($db): CustomText
    {
        if (FeatureManager::isEnabled('use_postgres_customtext')) {
            try {
                $pgDb = Database::getPostgres();
                return new \YNotRadio\Models\Implementations\PostgresCustomText($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed for CustomText, falling back to MySQL: " . $e->getMessage());
                return new \YNotRadio\Models\Implementations\SqlCustomText($db);
            }
        }

        return new \YNotRadio\Models\Implementations\SqlCustomText($db);
    }
}
