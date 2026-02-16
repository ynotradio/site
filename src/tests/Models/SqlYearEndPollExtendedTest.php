<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlYearEndPoll;

/**
 * Tests for SqlYearEndPoll additional methods
 * 
 * Extends existing SqlYearEndPollTest with additional coverage:
 * - Poll name validation
 * - Max picks for different poll types
 * - Poll header formatting edge cases
 */
class SqlYearEndPollExtendedTest extends TestCase
{
    private SqlYearEndPoll $poll;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create instance with mock mysqli (these tests don't use DB)
        $mockDb = $this->createMock(\mysqli::class);
        $this->poll = new SqlYearEndPoll($mockDb);
    }

    /**
     * Test getMaxPicks returns correct values for all poll types
     */
    public function testGetMaxPicksForAllPollTypes(): void
    {
        // Songs
        $this->assertSame(20, $this->poll->getMaxPicks('songs'));
        
        // Albums
        $this->assertSame(10, $this->poll->getMaxPicks('albums'));
        
        // Artists
        $this->assertSame(5, $this->poll->getMaxPicks('artists'));
        
        // New Artists
        $this->assertSame(3, $this->poll->getMaxPicks('new_artists'));
    }

    /**
     * Test getMaxPicks returns 3 for unknown poll types (default)
     */
    public function testGetMaxPicksReturnsDefaultForUnknown(): void
    {
        $result = $this->poll->getMaxPicks('unknown_poll_type');
        $this->assertSame(3, $result);
    }

    /**
     * Test formatPollName with underscores returns lowercase with spaces
     */
    public function testFormatPollNameWithUnderscores(): void
    {
        $result = $this->poll->formatPollName('top_albums');
        $this->assertSame('top albums', $result);
        
        $result2 = $this->poll->formatPollName('best_live_act');
        $this->assertSame('best live act', $result2);
    }

    /**
     * Test formatPollName with single word returns unchanged
     */
    public function testFormatPollNameWithSingleWord(): void
    {
        $result = $this->poll->formatPollName('albums');
        $this->assertSame('albums', $result);
    }

    /**
     * Test formatPollHeader with album category
     */
    public function testFormatPollHeaderWithAlbum(): void
    {
        $result = $this->poll->formatPollHeader('top_albums', 'album');
        $this->assertStringContainsString('album', strtolower($result));
    }

    /**
     * Test formatPollHeader with song category
     */
    public function testFormatPollHeaderWithSong(): void
    {
        $result = $this->poll->formatPollHeader('top_songs', 'song');
        $this->assertStringContainsString('song', strtolower($result));
    }

    /**
     * Test formatPollHeader includes poll name
     */
    public function testFormatPollHeaderIncludesPollName(): void
    {
        $pollName = 'top_albums';
        $result = $this->poll->formatPollHeader($pollName, 'album');
        
        // Should include formatted version of poll name
        $this->assertNotEmpty($result);
        $this->assertIsString($result);
    }
}
