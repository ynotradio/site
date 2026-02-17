<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlCdOfTheWeek;

/**
 * Tests for SqlCdOfTheWeek validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation
 */
class SqlCdOfTheWeekTest extends TestCase
{
    private SqlCdOfTheWeek $cdOfTheWeek;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->cdOfTheWeek = new SqlCdOfTheWeek($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'artist' is missing
     */
    public function testAddThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: artist");
        
        $data = [
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'title' is missing
     */
    public function testAddThrowsExceptionWhenTitleMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: title");
        
        $data = [
            'artist' => 'Test Artist',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'label' is missing
     */
    public function testAddThrowsExceptionWhenLabelMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: label");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'review' is missing
     */
    public function testAddThrowsExceptionWhenReviewMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: review");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'cd_pic_url' is missing
     */
    public function testAddThrowsExceptionWhenCdPicUrlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: cd_pic_url");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'band' is missing
     */
    public function testAddThrowsExceptionWhenBandMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: band");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'reviewer' is missing
     */
    public function testAddThrowsExceptionWhenReviewerMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: reviewer");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test add throws exception when required field 'date' is missing
     */
    public function testAddThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: date");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe'
        ];
        
        $this->cdOfTheWeek->add($data);
    }

    /**
     * Test update throws exception when required field 'artist' is missing
     */
    public function testUpdateThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: artist");
        
        $data = [
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'date' is missing
     */
    public function testUpdateThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: date");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe'
        ];
        
        $this->cdOfTheWeek->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'artist' is empty
     */
    public function testUpdateThrowsExceptionWhenArtistEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: artist");
        
        $data = [
            'artist' => '   ',  // Empty/whitespace only
            'title' => 'Test Album',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'title' is empty
     */
    public function testUpdateThrowsExceptionWhenTitleEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: title");
        
        $data = [
            'artist' => 'Test Artist',
            'title' => '',
            'label' => 'Test Label',
            'review' => 'Great album!',
            'cd_pic_url' => 'http://example.com/cd.jpg',
            'band' => 'http://band.com',
            'reviewer' => 'John Doe',
            'date' => '2026-02-16'
        ];
        
        $this->cdOfTheWeek->update(1, $data);
    }
}
