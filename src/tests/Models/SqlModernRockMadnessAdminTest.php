<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlModernRockMadnessAdmin;

/**
 * Tests for SqlModernRockMadnessAdmin pure functions
 * 
 * Tests pure logic that doesn't require DB interaction:
 * - calculateVotePercentage() - Vote percentage calculation
 * - isMatchTied() - Match tie detection
 */
class SqlModernRockMadnessAdminTest extends TestCase
{
    private SqlModernRockMadnessAdmin $model;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->model = new SqlModernRockMadnessAdmin($this->mockDb);
    }

    /**
     * Test calculateVotePercentage with zero votes and default display
     */
    public function testCalculateVotePercentageWithZeroVotesDefaultDisplay(): void
    {
        $result = $this->model->calculateVotePercentage(0, 0);
        $this->assertSame('', $result);
    }

    /**
     * Test calculateVotePercentage with zero votes and block display
     */
    public function testCalculateVotePercentageWithZeroVotesBlockDisplay(): void
    {
        $result = $this->model->calculateVotePercentage(0, 0, 'block');
        $this->assertSame('50%', $result);
    }

    /**
     * Test calculateVotePercentage with normal votes
     */
    public function testCalculateVotePercentageWithNormalVotes(): void
    {
        // 60 out of 100 = 60%
        $result = $this->model->calculateVotePercentage(60, 40);
        $this->assertSame('60%', $result);
    }

    /**
     * Test calculateVotePercentage with one-sided votes
     */
    public function testCalculateVotePercentageWithOneSidedVotes(): void
    {
        // 100 out of 100 = 100%
        $result = $this->model->calculateVotePercentage(100, 0);
        $this->assertSame('100%', $result);
    }

    /**
     * Test calculateVotePercentage with close race
     */
    public function testCalculateVotePercentageWithCloseRace(): void
    {
        // 51 out of 100 = 51%
        $result = $this->model->calculateVotePercentage(51, 49);
        $this->assertSame('51%', $result);
    }

    /**
     * Test calculateVotePercentage rounds correctly
     */
    public function testCalculateVotePercentageRoundsCorrectly(): void
    {
        // 2 out of 3 = 66.666... rounds to 67%
        $result = $this->model->calculateVotePercentage(2, 1);
        $this->assertSame('67%', $result);
    }

    /**
     * Test calculateVotePercentage with landslide
     */
    public function testCalculateVotePercentageWithLandslide(): void
    {
        // 150 out of 170 = 88.235... rounds to 88%
        $result = $this->model->calculateVotePercentage(150, 20);
        $this->assertSame('88%', $result);
    }

    /**
     * Test isMatchTied returns true when votes are equal
     */
    public function testIsMatchTiedReturnsTrueWhenEqual(): void
    {
        $match = [
            'band1_votes' => 100,
            'band2_votes' => 100
        ];
        
        $result = $this->model->isMatchTied($match);
        $this->assertTrue($result);
    }

    /**
     * Test isMatchTied returns false when votes differ
     */
    public function testIsMatchTiedReturnsFalseWhenDifferent(): void
    {
        $match = [
            'band1_votes' => 100,
            'band2_votes' => 99
        ];
        
        $result = $this->model->isMatchTied($match);
        $this->assertFalse($result);
    }

    /**
     * Test isMatchTied with zero votes (still tied)
     */
    public function testIsMatchTiedWithZeroVotes(): void
    {
        $match = [
            'band1_votes' => 0,
            'band2_votes' => 0
        ];
        
        $result = $this->model->isMatchTied($match);
        $this->assertTrue($result);
    }

    /**
     * Test isMatchTied with one vote difference
     */
    public function testIsMatchTiedWithOneVoteDifference(): void
    {
        $match = [
            'band1_votes' => 50,
            'band2_votes' => 51
        ];
        
        $result = $this->model->isMatchTied($match);
        $this->assertFalse($result);
    }
}
