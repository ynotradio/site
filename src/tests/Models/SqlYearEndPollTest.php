<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlYearEndPoll;

/**
 * Tests for SqlYearEndPoll pure functions
 * 
 * Tests pure logic methods that don't require database access:
 * - formatPollHeader: Builds poll header with special case handling
 * - formatPollName: Formats poll name for display
 * - getMaxPicks: Returns max picks per poll category
 */
class SqlYearEndPollTest extends TestCase
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
     * Test formatPollHeader with standard poll
     */
    public function testFormatPollHeaderStandard(): void
    {
        $result = $this->poll->formatPollHeader('songs', 'Songs');
        $this->assertStringContainsString('Vote for Your Top', $result);
        $this->assertStringContainsString('20', $result); // songs has max 20 picks
        $this->assertStringContainsString('Songs', $result);
        $this->assertStringContainsString('of this Year', $result);
    }

    /**
     * Test formatPollHeader with unnecessary_sequels (special suffix)
     */
    public function testFormatPollHeaderUnnecessarySequels(): void
    {
        $result = $this->poll->formatPollHeader('unnecessary_sequels', 'Sequels');
        $this->assertStringContainsString('Sequels or Reboots', $result);
        $this->assertStringContainsString('of this Year', $result);
    }

    /**
     * Test formatPollHeader with most_anticipated_albums (different suffix)
     */
    public function testFormatPollHeaderMostAnticipated(): void
    {
        $result = $this->poll->formatPollHeader('most_anticipated_albums', 'Albums');
        $this->assertStringContainsString('for next Year', $result);
        $this->assertStringNotContainsString('of this Year', $result);
    }

    /**
     * Test formatPollName replaces underscores with spaces
     */
    public function testFormatPollNameStandard(): void
    {
        $result = $this->poll->formatPollName('best_movies');
        $this->assertSame('best movies', $result);
        
        $result = $this->poll->formatPollName('tv_dramas');
        $this->assertSame('tv dramas', $result);
    }

    /**
     * Test formatPollName with most_anticipated_albums (adds year)
     */
    public function testFormatPollNameMostAnticipated(): void
    {
        $result = $this->poll->formatPollName('most_anticipated_albums');
        $expectedYear = date('Y') + 1;
        $this->assertStringContainsString((string)$expectedYear, $result);
        $this->assertStringContainsString('most anticipated', $result);
        $this->assertStringContainsString('albums', $result);
    }

    /**
     * Test getMaxPicks returns correct values for known polls
     */
    public function testGetMaxPicksKnownPolls(): void
    {
        $this->assertSame(20, $this->poll->getMaxPicks('songs'));
        $this->assertSame(10, $this->poll->getMaxPicks('albums'));
        $this->assertSame(5, $this->poll->getMaxPicks('artists'));
        $this->assertSame(3, $this->poll->getMaxPicks('new_artists'));
        $this->assertSame(2, $this->poll->getMaxPicks('concerts'));
        $this->assertSame(3, $this->poll->getMaxPicks('tv_dramas'));
    }

    /**
     * Test getMaxPicks returns default for unknown poll
     */
    public function testGetMaxPicksUnknownPoll(): void
    {
        $result = $this->poll->getMaxPicks('unknown_poll_xyz');
        $this->assertSame(3, $result); // Default value
    }
}
