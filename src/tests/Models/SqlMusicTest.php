<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlMusic;

/**
 * Tests for SqlMusic validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation with empty string checks
 */
class SqlMusicTest extends TestCase
{
    private SqlMusic $music;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->music = new SqlMusic($this->mockDb);
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
            'song' => 'Test Song'
        ];
        
        $this->music->add($data);
    }

    /**
     * Test add throws exception when required field 'artist' is missing
     */
    public function testAddThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: artist");
        
        $data = [
            'date' => '2026-02-16',
            'song' => 'Test Song'
        ];
        
        $this->music->add($data);
    }

    /**
     * Test add throws exception when required field 'song' is missing
     */
    public function testAddThrowsExceptionWhenSongMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: song");
        
        $data = [
            'date' => '2026-02-16',
            'artist' => 'Test Artist'
        ];
        
        $this->music->add($data);
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
            'song' => 'Test Song'
        ];
        
        $this->music->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'artist' is missing
     */
    public function testUpdateThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: artist");
        
        $data = [
            'date' => '2026-02-16',
            'song' => 'Test Song'
        ];
        
        $this->music->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'song' is missing
     */
    public function testUpdateThrowsExceptionWhenSongMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: song");
        
        $data = [
            'date' => '2026-02-16',
            'artist' => 'Test Artist'
        ];
        
        $this->music->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'date' is empty
     */
    public function testUpdateThrowsExceptionWhenDateEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: date");
        
        $data = [
            'date' => '   ',  // Empty/whitespace only
            'artist' => 'Test Artist',
            'song' => 'Test Song'
        ];
        
        $this->music->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'artist' is empty
     */
    public function testUpdateThrowsExceptionWhenArtistEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: artist");
        
        $data = [
            'date' => '2026-02-16',
            'artist' => '',
            'song' => 'Test Song'
        ];
        
        $this->music->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'song' is empty
     */
    public function testUpdateThrowsExceptionWhenSongEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: song");
        
        $data = [
            'date' => '2026-02-16',
            'artist' => 'Test Artist',
            'song' => ''
        ];
        
        $this->music->update(1, $data);
    }
}
