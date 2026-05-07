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
     * Test that a feature disabled in config returns false
     */
    public function testFeatureDisabledInConfig(): void
    {
        // use_postgres_music is still false in src/config/features.php — exercises the disabled path.
        $result = FeatureManager::isEnabled('use_postgres_music');

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
        // Set an environment variable that overrides the config (use_postgres_music defaults to false)
        putenv('USE_POSTGRES_MUSIC=true');

        $result = FeatureManager::isEnabled('use_postgres_music');
        $this->assertTrue($result);

        // Clean up
        putenv('USE_POSTGRES_MUSIC');
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
}
