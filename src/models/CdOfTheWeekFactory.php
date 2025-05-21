<?php

namespace YNotRadio\Models;

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\implementations\SqlCdOfTheWeek;
use YNotRadio\Models\implementations\GraphQLCdOfTheWeek;

class CdOfTheWeekFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('use_new_cd_of_the_week')) {
            return new GraphQLCdOfTheWeek($db);
        }
        return new SqlCdOfTheWeek($db);
    }
} 