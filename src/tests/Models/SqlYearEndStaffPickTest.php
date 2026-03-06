<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlYearEndStaffPick;

/**
 * Tests for SqlYearEndStaffPick validation and simple logic
 * 
 * Tests methods that have testable logic without database dependencies:
 * - getCount: Test with empty result
 */
class SqlYearEndStaffPickTest extends TestCase
{
    private SqlYearEndStaffPick $staffPick;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->staffPick = new SqlYearEndStaffPick($this->mockDb);
    }

    /**
     * Test getCount returns 0 when no staff picks exist
     */
    public function testGetCountReturnsZeroWhenEmpty(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(false);

        $this->mockDb->method('query')
            ->willReturn($mockResult);

        $result = $this->staffPick->getCount();
        $this->assertSame(0, $result);
    }
}
