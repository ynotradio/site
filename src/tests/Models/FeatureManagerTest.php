<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\FeatureManager;

/**
 * Tests for FeatureManager::isEnabled()
 * 
 * Tests the feature flag system which checks:
 * 1. Runtime feature flags (cookies/URL params) - highest priority
 * 2. Environment variables - medium priority
 * 3. Config file (src/config/features.php) - lowest priority (fallback)
 */
class FeatureManagerTest extends TestCase
{
    /**
     * Test that a feature missing from config returns false
     */
    public function testFeatureMissingFromConfig(): void
    {
        // Generic feature name not present in src/config/features.php — exercises the disabled path.
        $result = FeatureManager::isEnabled('disabled_feature_xyz');

        $this->assertFalse($result);
    }
    
    /**
     * Test that a non-existent feature returns false
     */
    public function testNonExistentFeatureReturnsFalse(): void
    {
        $result = FeatureManager::isEnabled('nonexistent_feature_xyz');
        $this->assertFalse($result);
    }
    
    /**
     * Test that environment variable can override config
     */
    public function testEnvironmentVariableOverridesConfig(): void
    {
        // Set an environment variable for a feature that's not in the config (defaults to false)
        putenv('SOME_FEATURE=true');

        $result = FeatureManager::isEnabled('some_feature');
        $this->assertTrue($result);

        // Clean up
        putenv('SOME_FEATURE');
    }
    
    /**
     * Test various truthy values in environment variables
     */
    public function testEnvironmentVariableTruthyValues(): void
    {
        $truthyValues = ['true', '1', 'yes', 'on', 'TRUE', 'YES', 'ON'];
        
        foreach ($truthyValues as $value) {
            putenv("TEST_FEATURE={$value}");
            $result = FeatureManager::isEnabled('test_feature');
            $this->assertTrue($result, "Failed for truthy value: {$value}");
            putenv('TEST_FEATURE');
        }
    }
    
    /**
     * Test various falsy values in environment variables
     */
    public function testEnvironmentVariableFalsyValues(): void
    {
        $falsyValues = ['false', '0', 'no', 'off', 'FALSE', 'NO', 'OFF'];
        
        foreach ($falsyValues as $value) {
            putenv("TEST_FEATURE={$value}");
            $result = FeatureManager::isEnabled('test_feature');
            $this->assertFalse($result, "Failed for falsy value: {$value}");
            putenv('TEST_FEATURE');
        }
    }
    
    /**
     * Test that whitespace in environment variables is trimmed
     */
    public function testEnvironmentVariableWhitespaceIsTrimmed(): void
    {
        putenv('TEST_FEATURE=  true  ');
        $result = FeatureManager::isEnabled('test_feature');
        $this->assertTrue($result);
        putenv('TEST_FEATURE');
    }

    /**
     * Test that CP routes suppress use_postgres_* flags
     */
    public function testControlPanelRequestSuppressesPostgresFlags(): void
    {
        $originalScriptName = $_SERVER['SCRIPT_NAME'] ?? null;
        $_SERVER['SCRIPT_NAME'] = '/cp/story_view_all.php';
        putenv('USE_POSTGRES_STORIES=true');

        $result = FeatureManager::isEnabled('use_postgres_stories');
        $this->assertFalse($result);

        putenv('USE_POSTGRES_STORIES');
        if ($originalScriptName === null) {
            unset($_SERVER['SCRIPT_NAME']);
        } else {
            $_SERVER['SCRIPT_NAME'] = $originalScriptName;
        }
    }
}
