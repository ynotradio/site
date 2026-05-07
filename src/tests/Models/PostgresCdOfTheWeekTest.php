<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresCdOfTheWeek;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresCdOfTheWeek basic operations
 * 
 * Tests PostgreSQL CD of the Week operations using PDO:
 * - getById: Retrieve CD by ID
 * - getCurrent: Get the most recent CD of the week
 */
class PostgresCdOfTheWeekTest extends TestCase
{
    private PostgresCdOfTheWeek $cdOfTheWeek;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->cdOfTheWeek = new PostgresCdOfTheWeek($this->mockDb);
    }

    /**
     * Test getById returns data when CD exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-02-16 00:00:00',
            'reviewer' => 'John Doe',
            'review' => 'Great album!',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'artist' => 'Test Artist',
            'band' => 'http://band.com',
            'cd_pic_url' => 'http://pic.jpg',
            'deleted' => 'no'
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with([
                'id' => 1,
                'legacy_id' => 1,
            ])
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($rawData);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->cdOfTheWeek->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Album', $result['title']);
        $this->assertSame('Test Artist', $result['artist']);
    }

    /**
     * Test getById returns null when CD doesn't exist
     */
    public function testGetByIdReturnsNullWhenNotFound(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with([
                'id' => 999,
                'legacy_id' => 999,
            ])
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->cdOfTheWeek->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test getCurrent returns most recent CD
     */
    public function testGetCurrentReturnsMostRecent(): void
    {
        $rawData = [
            'id' => 5,
            'date' => '2026-02-16 00:00:00',
            'reviewer' => 'Jane Smith',
            'review' => 'Amazing!',
            'title' => 'Latest Album',
            'label' => 'Latest Label',
            'artist' => 'Latest Artist',
            'band' => '',
            'cd_pic_url' => '',
            'deleted' => 'no'
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($rawData);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->with($this->stringContains('ORDER BY c.date DESC'))
            ->willReturn($mockStmt);

        $result = $this->cdOfTheWeek->getCurrent();
        
        $this->assertIsArray($result);
        $this->assertSame(5, $result['id']);
        $this->assertSame('Latest Album', $result['title']);
    }

    /**
     * Test getCurrent returns null when no CDs exist
     */
    public function testGetCurrentReturnsNullWhenNoCDs(): void
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

        $result = $this->cdOfTheWeek->getCurrent();
        $this->assertNull($result);
    }
}
