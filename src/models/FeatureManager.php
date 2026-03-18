<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/../lib/feature-flags.php';

class FeatureManager {
    private static $features = null;
    private static $featureFlags = null;
    private static bool $cpContext = false;

    /**
     * Mark the current request as a control panel page.
     * PostgreSQL feature flags are suppressed in this context because
     * the CP is legacy code that will be replaced by Payload CMS.
     */
    public static function setCpContext(): void {
        self::$cpContext = true;
    }

    public static function isEnabled(string $feature): bool {
        // CP pages always use MySQL — they're legacy and will be replaced by Payload
        if (self::$cpContext && str_starts_with($feature, 'use_postgres_')) {
            return false;
        }

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