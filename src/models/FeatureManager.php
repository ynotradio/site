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

    /**
     * Decide whether a custom-text page should be served from Postgres.
     *
     * Layered so pages can cut over individually before the whole feature:
     *   1. CP routes always read/write legacy MySQL.
     *   2. The global `use_postgres_customtext` flag moves every page at once.
     *   3. Otherwise a per-permalink allowlist moves individual pages early.
     *
     * @param string|null $permalink The custom-text permalink being resolved,
     *                               or null when the caller has no single
     *                               permalink (e.g. CP list views) -- such
     *                               callers only get Postgres via the global flag.
     */
    public static function usePostgresForCustomText(?string $permalink): bool
    {
        if (self::isControlPanelRequest()) {
            return false;
        }

        if (self::isEnabled('use_postgres_customtext')) {
            return true;
        }

        if ($permalink !== null && $permalink !== '') {
            return in_array($permalink, self::getCustomTextPostgresPermalinks(), true);
        }

        return false;
    }

    /**
     * Permalinks cut over to Postgres ahead of the global flag: the union of
     * the config allowlist (`postgres_customtext_permalinks`) and the
     * comma-separated USE_POSTGRES_CUSTOMTEXT_PERMALINKS env var, so prod can
     * add a page without a deploy.
     *
     * @return string[]
     */
    public static function getCustomTextPostgresPermalinks(): array
    {
        if (self::$features === null) {
            self::$features = require __DIR__ . '/../config/features.php';
        }

        $fromConfig = self::$features['postgres_customtext_permalinks'] ?? [];

        $fromEnv = [];
        $envValue = getenv('USE_POSTGRES_CUSTOMTEXT_PERMALINKS');
        if ($envValue !== false && trim($envValue) !== '') {
            $fromEnv = array_map('trim', explode(',', $envValue));
        }

        return array_values(
            array_unique(array_filter(array_merge($fromConfig, $fromEnv), 'strlen'))
        );
    }
} 