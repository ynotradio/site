<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresConcert;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresConcert basic operations
 * 
 * Tests PostgreSQL concert operations using PDO:
 * - getById: Retrieve concert by ID
 */
class PostgresConcertTest extends TestCase
{
    private PostgresConcert $concert;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->concert = new PostgresConcert($this->mockDb);
    }

    /**
     * Test getById returns data when concert exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-03-15 00:00:00',
            'venue_id' => 1,
            'ticketinfo' => 'On Sale',
            'ticketurl' => 'http://example.com',
            'venue' => 'Test Venue',
            'artist' => 'Test Band',
            'band_url' => 'http://band.com',
            'band_pic_url' => 'http://pic.jpg',
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

        $result = $this->concert->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Band', $result['artist']);
        $this->assertSame('No', $result['featured']); // featured field has been removed; always 'No'
    }

    /**
     * Test getById returns null when concert doesn't exist
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

        $result = $this->concert->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test getById always reports featured as 'No' since the field was removed
     */
    public function testGetByIdAlwaysReportsFeaturedAsNo(): void
    {
        $rawData = [
            'id' => 1,
            'date' => '2026-03-15 00:00:00',
            'artist' => 'Test',
            'venue' => 'Venue'
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($rawData);

        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->concert->getById(1);
        $this->assertSame('No', $result['featured']);
    }

    /**
     * Test that getFeatured always returns an empty array (feature removed)
     */
    public function testGetFeaturedReturnsEmptyArray(): void
    {
        $this->mockDb->expects($this->never())->method('prepare');
        $result = $this->concert->getFeatured(5);
        $this->assertSame([], $result);
    }
}
