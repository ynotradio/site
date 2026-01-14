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

        // Second, check environment variables (from .env file)
        // Convert feature name to env var format: use_postgres_concerts -> USE_POSTGRES_CONCERTS
        $envVarName = strtoupper($feature);
        $envValue = getenv($envVarName);
        if ($envValue !== false) {
            // Environment variable is set, so it overrides config file
            // Check for truthy values: 'true', '1', 'yes', 'on'
            $envValue = strtolower(trim($envValue));
            return in_array($envValue, ['true', '1', 'yes', 'on'], true);
        }

        // Fall back to config file
        if (self::$features === null) {
            self::$features = require __DIR__ . '/../config/features.php';
        }

        return self::$features[$feature] ?? false;
    }
} 