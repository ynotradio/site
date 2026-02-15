<?php

namespace YNotRadio\Tests\Config;

use YNotRadio\Tests\TestCase;

/**
 * Example test to verify PHPUnit setup is working
 * 
 * This test will be replaced by actual feature tests in subsequent PRs.
 */
class ExampleTest extends TestCase
{
    /**
     * Test that PHPUnit is configured correctly
     */
    public function testPhpUnitIsWorking(): void
    {
        $this->assertTrue(true, 'PHPUnit is configured and running');
    }
    
    /**
     * Test that the base TestCase helpers are available
     */
    public function testTestCaseHelpersAreAvailable(): void
    {
        // Test createMockDb helper
        $mockDb = $this->createMockDb();
        $this->assertInstanceOf(\mysqli::class, $mockDb);
        
        // Test assertPercentageFormat helper
        $this->assertPercentageFormat('50%');
        $this->assertPercentageFormat('100%');
        $this->assertPercentageFormat('0%');
    }
    
    /**
     * Test date format assertion helper
     */
    public function testDateFormatAssertion(): void
    {
        $this->assertDateFormat('Y-m-d', '2024-01-15');
        $this->assertDateFormat('Y', '2024');
    }
}
