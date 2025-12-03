<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Concert.php';
require_once __DIR__ . '/implementations/SqlConcert.php';
require_once __DIR__ . '/implementations/SanityConcert.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlConcert;
use YNotRadio\Models\Implementations\SanityConcert;

class ConcertFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('sanity')) {
            return new SanityConcert();
        }
        return new SqlConcert($db);
    }
}
