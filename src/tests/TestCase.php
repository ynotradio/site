<?php

namespace YNotRadio\Tests;

use PHPUnit\Framework\TestCase as PHPUnitTestCase;

/**
 * Base test case class with common helpers
 * 
 * Provides utilities for creating mocks, assertions, and test data
 * that are commonly needed across test suites.
 */
abstract class TestCase extends PHPUnitTestCase
{
    /**
     * Create a mock mysqli connection for testing
     * 
     * @return \mysqli|\PHPUnit\Framework\MockObject\MockObject
     */
    protected function createMockDb()
    {
        return $this->createMock(\mysqli::class);
    }
    
    /**
     * Create a mock mysqli_result for testing queries
     * 
     * @param array $rows Array of rows to return from fetch_assoc
     * @return \mysqli_result|\PHPUnit\Framework\MockObject\MockObject
     */
    protected function createMockResult(array $rows)
    {
        $mock = $this->createMock(\mysqli_result::class);
        
        // Set up fetch_assoc to return rows in sequence, then false
        $values = $rows;
        $values[] = false; // Add false at the end
        
        $mock->expects($this->any())
            ->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls(...$values);
            
        return $mock;
    }
    
    /**
     * Assert that a string matches a date format
     * 
     * @param string $format Date format (e.g., 'Y-m-d')
     * @param string $value Value to check
     * @param string $message Optional assertion message
     */
    protected function assertDateFormat(string $format, string $value, string $message = ''): void
    {
        $date = \DateTime::createFromFormat($format, $value);
        $this->assertTrue(
            $date !== false && $date->format($format) === $value,
            $message ?: "Failed asserting that '{$value}' matches date format '{$format}'"
        );
    }
    
    /**
     * Assert that a string is a valid percentage (e.g., "50%")
     * 
     * @param string $value Value to check
     * @param string $message Optional assertion message
     */
    protected function assertPercentageFormat(string $value, string $message = ''): void
    {
        $this->assertMatchesRegularExpression(
            '/^\d+%$/',
            $value,
            $message ?: "Failed asserting that '{$value}' is a valid percentage format"
        );
    }
}
