<?php

namespace YNotRadio\Models;

require_once(__DIR__ . "/CustomText.php");
require_once(__DIR__ . "/implementations/PostgresCustomText.php");
require_once(__DIR__ . "/implementations/SqlCustomText.php");
require_once(__DIR__ . "/FeatureManager.php");
require_once(__DIR__ . "/../lib/Database.php");

use YNotRadio\Models\Implementations\PostgresCustomText;
use YNotRadio\Models\Implementations\SqlCustomText;
use YNotRadio\Lib\Database;

class CustomTextFactory
{
    /**
     * Create a CustomText implementation.
     *
     * Custom text reads are flagged between MySQL and Postgres while we
     * validate the Postgres/Payload front-end output. When
     * `use_postgres_customtext` is enabled the read path is served from
     * Postgres; otherwise (the default) it falls back to MySQL. Control
     * Panel requests always resolve to MySQL because FeatureManager
     * suppresses `use_postgres_*` flags there, so the restored CP edit
     * screens continue to read and write the legacy `custom_texts` table.
     */
    public static function create($db): CustomText
    {
        if (FeatureManager::isEnabled('use_postgres_customtext')) {
            return new PostgresCustomText(Database::getPostgres());
        }

        return new SqlCustomText($db);
    }
}
