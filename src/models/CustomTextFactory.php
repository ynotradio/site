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
     * validate the Postgres/Payload front-end output. The read path is served
     * from Postgres when the global `use_postgres_customtext` flag is enabled,
     * OR when the given permalink is on the per-permalink cutover allowlist
     * (letting clean pages move ahead of the global flip); otherwise (the
     * default) it falls back to MySQL. Control Panel requests always resolve to
     * MySQL because FeatureManager suppresses the cutover there, so the restored
     * CP edit screens continue to read and write the legacy `custom_texts` table.
     *
     * @param mixed       $db        Legacy MySQL connection (used by SqlCustomText).
     * @param string|null $permalink The permalink being resolved, so per-page
     *                               gating can apply. Omit for callers without a
     *                               single permalink (e.g. CP list views), which
     *                               then only reach Postgres via the global flag.
     */
    public static function create($db, ?string $permalink = null): CustomText
    {
        if (FeatureManager::usePostgresForCustomText($permalink)) {
            return new PostgresCustomText(Database::getPostgres());
        }

        return new SqlCustomText($db);
    }
}
