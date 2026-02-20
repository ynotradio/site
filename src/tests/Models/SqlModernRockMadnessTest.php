<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlModernRockMadness;

/**
 * Tests for SqlModernRockMadness pure functions
 * 
 * Tests pure logic methods that don't require database access:
 * - calculateVotePercentage: Vote percentage calculation with display modes
 * - isMatchTied: Match tie detection
 * - getTournamentYear: Year extraction from date strings
 */
class SqlModernRockMadnessTest extends TestCase
{
    private SqlModernRockMadness $mrm;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create instance with mock mysqli (these tests don't use DB)
        $mockDb = $this->createMock(\mysqli::class);
        $this->mrm = new SqlModernRockMadness($mockDb);
    }

    /**
     * Test calculateVotePercentage with zero votes returns empty string
     */
    public function testCalculateVotePercentageWithZeroVotes(): void
    {
        $result = $this->mrm->calculateVotePercentage(0, 0, 'none');
        $this->assertSame('', $result);
    }

    /**
     * Test calculateVotePercentage with zero votes and 'show' display returns 50%
     */
    public function testCalculateVotePercentageZeroVotesShowDisplay(): void
    {
        $result = $this->mrm->calculateVotePercentage(0, 0, 'show');
        $this->assertSame('50%', $result);
    }

    /**
     * Test calculateVotePercentage with normal vote counts
     */
    public function testCalculateVotePercentageNormalVotes(): void
    {
        // 75 votes for band1, 25 votes for band2 = 75%
        $result = $this->mrm->calculateVotePercentage(75, 25);
        $this->assertSame('75%', $result);

        // 1 vote for band1, 3 votes for band2 = 25%
        $result = $this->mrm->calculateVotePercentage(1, 3);
        $this->assertSame('25%', $result);

        // 50/50 split
        $result = $this->mrm->calculateVotePercentage(50, 50);
        $this->assertSame('50%', $result);
    }

    /**
     * Test isMatchTied returns true when votes are equal
     */
    public function testIsMatchTiedWhenEqual(): void
    {
        $match = [
            'band1_votes' => 42,
            'band2_votes' => 42
        ];
        
        $result = $this->mrm->isMatchTied($match);
        $this->assertTrue($result);
    }

    /**
     * Test isMatchTied returns false when votes differ
     */
    public function testIsMatchTiedWhenDifferent(): void
    {
        $match = [
            'band1_votes' => 100,
            'band2_votes' => 95
        ];
        
        $result = $this->mrm->isMatchTied($match);
        $this->assertFalse($result);
    }

    /**
     * Test getTournamentYear extracts year from date string
     */
    public function testGetTournamentYearFromDate(): void
    {
        $result = $this->mrm->getTournamentYear('2025-03-17');
        $this->assertSame('2025', $result);

        $result = $this->mrm->getTournamentYear('2024-02-05');
        $this->assertSame('2024', $result);
    }

    /**
     * Test getTournamentYear returns current year when null
     */
    public function testGetTournamentYearNull(): void
    {
        $result = $this->mrm->getTournamentYear(null);
        $this->assertSame(date('Y'), $result);
    }
}
