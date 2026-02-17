<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlOnDemand;

/**
 * Tests for SqlOnDemand validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation with empty string checks
 */
class SqlOnDemandTest extends TestCase
{
    private SqlOnDemand $onDemand;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->onDemand = new SqlOnDemand($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'date' is missing
     */
    public function testAddThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: date");
        
        $data = [
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test add throws exception when required field 'image' is missing
     */
    public function testAddThrowsExceptionWhenImageMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: image");
        
        $data = [
            'date' => '2026-02-16',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test add throws exception when required field 'headline' is missing
     */
    public function testAddThrowsExceptionWhenHeadlineMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: headline");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test add throws exception when required field 'note' is missing
     */
    public function testAddThrowsExceptionWhenNoteMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: note");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test add throws exception when required field 'songs' is missing
     */
    public function testAddThrowsExceptionWhenSongsMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: songs");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test add throws exception when required field 'audio_id' is missing
     */
    public function testAddThrowsExceptionWhenAudioIdMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: audio_id");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2'
        ];
        
        $this->onDemand->add($data);
    }

    /**
     * Test update throws exception when required field 'date' is missing
     */
    public function testUpdateThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: date");
        
        $data = [
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'headline' is empty
     */
    public function testUpdateThrowsExceptionWhenHeadlineEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: headline");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'headline' => '   ',  // Empty/whitespace only
            'note' => 'Test note',
            'songs' => 'Song 1, Song 2',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'songs' is empty
     */
    public function testUpdateThrowsExceptionWhenSongsEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: songs");
        
        $data = [
            'date' => '2026-02-16',
            'image' => 'test.jpg',
            'headline' => 'Test Show',
            'note' => 'Test note',
            'songs' => '',
            'audio_id' => '12345'
        ];
        
        $this->onDemand->update(1, $data);
    }
}
