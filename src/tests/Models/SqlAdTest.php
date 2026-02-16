<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlAd;

/**
 * Tests for SqlAd validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation with empty string checks
 */
class SqlAdTest extends TestCase
{
    private SqlAd $ad;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->ad = new SqlAd($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'name' is missing
     */
    public function testAddThrowsExceptionWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: name");
        
        $data = [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test add throws exception when required field 'start_date' is missing
     */
    public function testAddThrowsExceptionWhenStartDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: start_date");
        
        $data = [
            'name' => 'Test Ad',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test add throws exception when required field 'end_date' is missing
     */
    public function testAddThrowsExceptionWhenEndDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: end_date");
        
        $data = [
            'name' => 'Test Ad',
            'start_date' => '2026-01-01',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test add throws exception when required field 'pic_url' is missing
     */
    public function testAddThrowsExceptionWhenPicUrlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: pic_url");
        
        $data = [
            'name' => 'Test Ad',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test add throws exception when required field 'web_url' is missing
     */
    public function testAddThrowsExceptionWhenWebUrlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: web_url");
        
        $data = [
            'name' => 'Test Ad',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'priority' => 1
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test add throws exception when required field 'priority' is missing
     */
    public function testAddThrowsExceptionWhenPriorityMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: priority");
        
        $data = [
            'name' => 'Test Ad',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com'
        ];
        
        $this->ad->add($data);
    }

    /**
     * Test update throws exception when required field 'name' is missing
     */
    public function testUpdateThrowsExceptionWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: name");
        
        $data = [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'name' is empty
     */
    public function testUpdateThrowsExceptionWhenNameEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: name");
        
        $data = [
            'name' => '   ',  // Empty/whitespace only
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->ad->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'priority' is empty
     */
    public function testUpdateThrowsExceptionWhenPriorityEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: priority");
        
        $data = [
            'name' => 'Test Ad',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'pic_url' => 'http://example.com/ad.jpg',
            'web_url' => 'http://example.com',
            'priority' => ''
        ];
        
        $this->ad->update(1, $data);
    }
}
