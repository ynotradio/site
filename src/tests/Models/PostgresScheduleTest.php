<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresSchedule;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresSchedule basic operations
 * 
 * Tests PostgreSQL schedule operations using PDO:
 * - getById: Retrieve schedule entry by ID
 * - getByDate: Get all entries for a specific date
 */
class PostgresScheduleTest extends TestCase
{
    private PostgresSchedule $schedule;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->schedule = new PostgresSchedule($this->mockDb);
    }

    /**
     * Test getById returns formatted data when entry exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-02-16',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'host' => 'DJ Test',
            'note' => 'Test show',
            'deleted' => 'n'
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with(['id' => 1])
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($rawData);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->schedule->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('DJ Test', $result['host']);
    }

    /**
     * Test getById returns null when entry doesn't exist
     */
    public function testGetByIdReturnsNullWhenNotFound(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->schedule->getById(999);
        $this->assertNull($result);
    }
}
