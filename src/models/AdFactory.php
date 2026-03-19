<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Ad.php';
require_once __DIR__ . '/implementations/SqlAd.php';
require_once __DIR__ . '/implementations/PostgresAd.php';
require_once __DIR__ . '/../lib/Database.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlAd;
use YNotRadio\Models\Implementations\PostgresAd;
use YNotRadio\Lib\Database;

class AdFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('use_postgres_ads')) {
            try {
                $pgDb = Database::getPostgres();
                return new PostgresAd($pgDb);
            } catch (\PDOException $e) {
                error_log("PostgreSQL connection failed for ads, falling back to MySQL: " . $e->getMessage());
                return new SqlAd($db);
            }
        }
        return new SqlAd($db);
    }
} 