<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresCustomText;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresCustomText basic operations
 * 
 * Tests PostgreSQL custom text operations using PDO:
 * - getById: Retrieve custom text by ID
 * - findByPermalink: Find custom text by permalink/slug
 */
class PostgresCustomTextTest extends TestCase
{
    private PostgresCustomText $customText;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->customText = new PostgresCustomText($this->mockDb);
    }

    /**
     * Test getById returns data when custom text exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'permalink' => 'test-page',
            'title' => 'Test Page',
            'html' => '<p>Test content</p>',
            'legacy_id' => 123
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

        $result = $this->customText->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Page', $result['title']);
    }

    /**
     * Test getById returns null when custom text doesn't exist
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

        $result = $this->customText->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test findByPermalink returns data when permalink exists
     */
    public function testFindByPermalinkReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'permalink' => 'test-page',
            'title' => 'Test Page',
            'html' => '<p>Test content</p>',
            'legacy_id' => 123
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with(['permalink' => 'test-page'])
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($rawData);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->customText->findByPermalink('test-page');
        
        $this->assertIsArray($result);
        $this->assertSame('test-page', $result['permalink']);
        $this->assertSame('Test Page', $result['title']);
    }

    /**
     * Test findByPermalink returns null when permalink doesn't exist
     */
    public function testFindByPermalinkReturnsNullWhenNotFound(): void
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

        $result = $this->customText->findByPermalink('nonexistent');
        $this->assertNull($result);
    }
}
