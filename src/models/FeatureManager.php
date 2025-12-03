<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/../lib/feature-flags.php';

class FeatureManager {
    private static $features = null;
    private static $featureFlags = null;

    public static function isEnabled(string $feature): bool {
        // First check runtime feature flags (cookie/URL parameter)
        if (self::$featureFlags === null) {
            self::$featureFlags = new \FeatureFlags([
                'cookie' => 'FF',
                'uriParam' => 'ff'
            ]);
        }

        if (self::$featureFlags->hasFlag($feature)) {
            return true;
        }

        // Fall back to config file
        if (self::$features === null) {
            self::$features = require __DIR__ . '/../config/features.php';
        }

        return self::$features[$feature] ?? false;
    }
} 