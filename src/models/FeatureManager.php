<?php

namespace YNotRadio\Models;

require_once __DIR__ . '/../lib/feature-flags.php';

class FeatureManager {
    private static $features = null;
    private static $featureFlags = null;

    public static function isEnabled(string $feature): bool {
        if (self::isControlPanelRequest() && str_starts_with($feature, 'use_postgres_')) {
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
        $envVarName = strtoupper($feature);
        $envValue = getenv($envVarName);
        if ($envValue !== false) {
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

    private static function isControlPanelRequest(): bool
    {
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        return str_contains($scriptName, '/cp/') || str_ends_with($scriptName, '/cp.php');
    }
} 