<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/CdOfTheWeek.php';
require_once __DIR__ . '/implementations/SqlCdOfTheWeek.php';
require_once __DIR__ . '/implementations/GraphQLCdOfTheWeek.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlCdOfTheWeek;
use YNotRadio\Models\Implementations\GraphQLCdOfTheWeek;

class CdOfTheWeekFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('use_new_cd_of_the_week')) {
            return new GraphQLCdOfTheWeek($db);
        }
        return new SqlCdOfTheWeek($db);
    }
} 