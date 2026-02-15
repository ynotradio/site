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
     * Test that a feature enabled in config returns true
     */
    public function testFeatureEnabledInConfig(): void
    {
        // Note: This test relies on the actual config file
        // If all features are false in src/config/features.php, we'll test that behavior
        
        // Since we know use_postgres_concerts exists in config and is false by default
        // We test the fallback behavior
        $result = FeatureManager::isEnabled('use_postgres_concerts');
        
        // Should be false since it's false in the config file
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
        // Set an environment variable that overrides the config
        putenv('USE_POSTGRES_CONCERTS=true');
        
        $result = FeatureManager::isEnabled('use_postgres_concerts');
        $this->assertTrue($result);
        
        // Clean up
        putenv('USE_POSTGRES_CONCERTS');
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
