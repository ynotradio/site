<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlStory;

/**
 * Tests for SqlStory validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation with empty string checks
 */
class SqlStoryTest extends TestCase
{
    private SqlStory $story;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->story = new SqlStory($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'headline' is missing
     */
    public function testAddThrowsExceptionWhenHeadlineMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: headline");
        
        $data = [
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'story' is missing
     */
    public function testAddThrowsExceptionWhenStoryMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: story");
        
        $data = [
            'headline' => 'Test Headline',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'start_date' is missing
     */
    public function testAddThrowsExceptionWhenStartDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: start_date");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'end_date' is missing
     */
    public function testAddThrowsExceptionWhenEndDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: end_date");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'pic' is missing
     */
    public function testAddThrowsExceptionWhenPicMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: pic");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'pic_url' is missing
     */
    public function testAddThrowsExceptionWhenPicUrlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: pic_url");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'priority' => 1
        ];
        
        $this->story->add($data);
    }

    /**
     * Test add throws exception when required field 'priority' is missing
     */
    public function testAddThrowsExceptionWhenPriorityMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: priority");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com'
        ];
        
        $this->story->add($data);
    }

    /**
     * Test update throws exception when required field 'headline' is missing
     */
    public function testUpdateThrowsExceptionWhenHeadlineMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: headline");
        
        $data = [
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'headline' is empty
     */
    public function testUpdateThrowsExceptionWhenHeadlineEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: headline");
        
        $data = [
            'headline' => '   ',  // Empty/whitespace only
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => 1
        ];
        
        $this->story->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'priority' is empty
     */
    public function testUpdateThrowsExceptionWhenPriorityEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: priority");
        
        $data = [
            'headline' => 'Test Headline',
            'story' => 'Test story content',
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-01',
            'pic' => 'story.jpg',
            'pic_url' => 'http://example.com',
            'priority' => ''
        ];
        
        $this->story->update(1, $data);
    }
}
