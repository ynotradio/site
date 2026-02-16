<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresOnDemand;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresOnDemand basic operations
 * 
 * Tests PostgreSQL on-demand operations using PDO:
 * - getById: Retrieve entry by ID
 * - getTotalCount: Get count of entries
 */
class PostgresOnDemandTest extends TestCase
{
    private PostgresOnDemand $onDemand;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->onDemand = new PostgresOnDemand($this->mockDb);
    }

    /**
     * Test getById returns data when entry exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-02-16 10:00:00',
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => '',
            'audio_url' => 'http://example.com/audio.mp3',
            'source' => 'opendrive'
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

        $result = $this->onDemand->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Show', $result['headline']);
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

        $result = $this->onDemand->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test getTotalCount returns count
     */
    public function testGetTotalCountReturnsCount(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn(['num' => 42]);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->onDemand->getTotalCount();
        $this->assertSame(42, $result);
    }
}
