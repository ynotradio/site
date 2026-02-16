<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresMusic;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresMusic basic operations
 * 
 * Tests PostgreSQL music operations using PDO:
 * - getById: Retrieve music entry by ID
 */
class PostgresMusicTest extends TestCase
{
    private PostgresMusic $music;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->music = new PostgresMusic($this->mockDb);
    }

    /**
     * Test getById returns data when music exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-02-16',
            'artist' => 'Test Artist',
            'song' => 'Test Song',
            'url' => 'http://stream.com',
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

        $result = $this->music->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Song', $result['song']);
        $this->assertSame('Test Artist', $result['artist']);
    }

    /**
     * Test getById returns null when music doesn't exist
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

        $result = $this->music->getById(999);
        $this->assertNull($result);
    }
}
