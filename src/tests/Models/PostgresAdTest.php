<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresAd;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresAd read-only operations
 *
 * Tests PostgreSQL ad operations using PDO:
 * - getById: Retrieve ad by ID with field mapping
 * - getAll: Retrieve published ads with limit
 * - getCurrent: Retrieve active ads within date range
 * - Write operations throw RuntimeException
 */
class PostgresAdTest extends TestCase
{
    private PostgresAd $ad;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->ad = new PostgresAd($this->mockDb);
    }

    /**
     * Sample raw row as returned by the Postgres query
     */
    private function sampleRow(): array
    {
        return [
            'id' => 1,
            'name' => 'Test Ad',
            'start_date' => '2025-01-01 00:00:00+00',
            'end_date' => '2025-12-31 23:59:59+00',
            'pic_url' => 'https://example.com/ad.jpg',
            'web_url' => 'https://example.com',
            'priority' => 5,
            'deleted' => 'n',
        ];
    }

    /**
     * Test getById returns formatted ad when found
     */
    public function testGetByIdReturnsFormattedAd(): void
    {
        $raw = $this->sampleRow();

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with(['id' => 1])
            ->willReturn(true);

        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($raw);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->ad->getById(1);

        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Ad', $result['name']);
        $this->assertSame('2025-01-01', $result['start_date']);
        $this->assertSame('2025-12-31', $result['end_date']);
        $this->assertSame('https://example.com/ad.jpg', $result['pic_url']);
        $this->assertSame('https://example.com', $result['web_url']);
        $this->assertSame(5, $result['priority']);
        $this->assertSame('n', $result['deleted']);
    }

    /**
     * Test getById returns null when ad not found
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

        $result = $this->ad->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test getAll returns formatted ads with limit binding
     */
    public function testGetAllReturnsFormattedAds(): void
    {
        $rows = [
            $this->sampleRow(),
            array_merge($this->sampleRow(), [
                'id' => 2,
                'name' => 'Second Ad',
                'priority' => 10,
            ]),
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('bindValue')
            ->with(':limit', 20, PDO::PARAM_INT);

        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $mockStmt->expects($this->once())
            ->method('fetchAll')
            ->willReturn($rows);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $results = $this->ad->getAll(20);

        $this->assertCount(2, $results);
        $this->assertSame('2025-01-01', $results[0]['start_date']);
        $this->assertSame('2025-12-31', $results[0]['end_date']);
        $this->assertSame('Second Ad', $results[1]['name']);
    }

    /**
     * Test getCurrent returns active ads filtered by date
     */
    public function testGetCurrentReturnsActiveAds(): void
    {
        $rows = [$this->sampleRow()];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $mockStmt->expects($this->once())
            ->method('fetchAll')
            ->willReturn($rows);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->with($this->callback(function (string $sql) {
                return str_contains($sql, "a._status = 'published'")
                    && str_contains($sql, 'a.start_date <= NOW()')
                    && str_contains($sql, 'a.end_date >= NOW()');
            }))
            ->willReturn($mockStmt);

        $results = $this->ad->getCurrent();

        $this->assertCount(1, $results);
        $this->assertSame('2025-01-01', $results[0]['start_date']);
    }

    /**
     * Test add throws RuntimeException
     */
    public function testAddThrowsException(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Write operations are not supported');
        $this->ad->add(['name' => 'test']);
    }

    /**
     * Test update throws RuntimeException
     */
    public function testUpdateThrowsException(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Write operations are not supported');
        $this->ad->update(1, ['name' => 'test']);
    }

    /**
     * Test delete throws RuntimeException
     */
    public function testDeleteThrowsException(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Write operations are not supported');
        $this->ad->delete(1);
    }

    /**
     * Test updateOrder throws RuntimeException
     */
    public function testUpdateOrderThrowsException(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Write operations are not supported');
        $this->ad->updateOrder(1, 5);
    }
}
