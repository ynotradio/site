<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresDeejay;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresDeejay basic operations
 * 
 * Tests PostgreSQL deejay operations using PDO:
 * - getById: Retrieve deejay by ID
 */
class PostgresDeejayTest extends TestCase
{
    private PostgresDeejay $deejay;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->deejay = new PostgresDeejay($this->mockDb);
    }

    /**
     * Test getById returns data when deejay exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'email' => 'dj@example.com',
            'description' => 'Test DJ',
            'external_connect_text' => 'Follow me',
            'external_connect_url' => 'http://social.com',
            'sort' => 1,
            'pic' => 'http://pic.jpg',
            'name' => 'Test DJ'
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

        $result = $this->deejay->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test DJ', $result['name']);
    }

    /**
     * Test getById returns null when deejay doesn't exist
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

        $result = $this->deejay->getById(999);
        $this->assertNull($result);
    }
}
