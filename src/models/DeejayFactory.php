<?php

namespace YNotRadio\Models;

// Require the necessary classes
require_once __DIR__ . '/FeatureManager.php';
require_once __DIR__ . '/Deejay.php';
require_once __DIR__ . '/implementations/SqlDeejay.php';
require_once __DIR__ . '/implementations/SanityDeejay.php';

use YNotRadio\Models\FeatureManager;
use YNotRadio\Models\Implementations\SqlDeejay;
use YNotRadio\Models\Implementations\SanityDeejay;

class DeejayFactory {
    public static function create($db) {
        if (FeatureManager::isEnabled('sanity_deejays')) {
            return new SanityDeejay();
        }
        return new SqlDeejay($db);
    }
}
