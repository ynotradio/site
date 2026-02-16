<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlModernRockMadness;

/**
 * Tests for SqlModernRockMadness timeline calculations
 * 
 * Tests pure logic for tournament timeline:
 * - getTimelineData: Round date calculations from start date
 * - getTournamentDates: Detailed date math for tournament schedule
 */
class SqlModernRockMadnessExtendedTest extends TestCase
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
     * Test getTimelineData returns array of rounds
     */
    public function testGetTimelineDataReturnsArray(): void
    {
        $startDate = '2024-03-01';
        
        $result = $this->mrm->getTimelineData($startDate);
        
        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
    }

    /**
     * Test getTimelineData with valid start date
     */
    public function testGetTimelineDataWithValidDate(): void
    {
        $startDate = '2024-03-01';
        
        $result = $this->mrm->getTimelineData($startDate);
        
        // Should return timeline with specific keys
        $this->assertArrayHasKey('first_round_left', $result);
        $this->assertArrayHasKey('championship', $result);
        $this->assertArrayHasKey('final_4', $result);
    }

    /**
     * Test getTimelineData returns all expected round keys
     */
    public function testGetTimelineDataHasAllRoundKeys(): void
    {
        $startDate = '2024-03-01';
        
        $result = $this->mrm->getTimelineData($startDate);
        
        // Should have 8 keys for tournament structure
        $expectedKeys = [
            'first_round_left', 'second_round_left', 'sweet_16', 'elusive_8',
            'final_4', 'championship', 'second_round_right', 'first_round_right'
        ];
        
        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $result);
        }
    }

    /**
     * Test getTournamentDates returns schedule information
     */
    public function testGetTournamentDatesReturnsSchedule(): void
    {
        $startDate = '2024-03-01';
        
        $result = $this->mrm->getTournamentDates($startDate);
        
        $this->assertIsArray($result);
        $this->assertNotEmpty($result);
        
        // Should have round keys
        $this->assertArrayHasKey('first_round_left', $result);
        $this->assertArrayHasKey('championship', $result);
    }

    /**
     * Test getTournamentYear extracts year correctly as string
     */
    public function testGetTournamentYearExtractsYearAsString(): void
    {
        $result1 = $this->mrm->getTournamentYear('2024-03-15');
        $this->assertSame('2024', $result1);
        
        $result2 = $this->mrm->getTournamentYear('2023-01-01');
        $this->assertSame('2023', $result2);
    }

    /**
     * Test getTournamentYear with null returns current year
     */
    public function testGetTournamentYearWithNullReturnsCurrentYear(): void
    {
        $result = $this->mrm->getTournamentYear(null);
        $currentYear = date('Y');
        $this->assertSame($currentYear, $result);
    }
}
