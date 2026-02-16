<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresStory;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresStory basic operations
 * 
 * Tests PostgreSQL story operations using PDO:
 * - getById: Retrieve story by ID
 */
class PostgresStoryTest extends TestCase
{
    private PostgresStory $story;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->story = new PostgresStory($this->mockDb);
    }

    /**
     * Test getById returns data when story exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'headline' => 'Test Story',
            'start_date' => '2026-02-01 00:00:00',
            'end_date' => '2026-02-28 23:59:59',
            'content' => 'Test content',
            'priority' => 1,
            'pic' => 'http://pic.jpg',
            'pic_url' => '',
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

        $result = $this->story->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Story', $result['headline']);
    }

    /**
     * Test getById returns null when story doesn't exist
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

        $result = $this->story->getById(999);
        $this->assertNull($result);
    }
}
