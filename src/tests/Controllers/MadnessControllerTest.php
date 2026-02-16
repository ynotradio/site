<?php

namespace YNotRadio\Tests\Controllers;

use YNotRadio\Tests\TestCase;
use YNotRadio\Controllers\MadnessController;
use YNotRadio\Models\ModernRockMadness;

/**
 * Tests for MadnessController business logic
 * 
 * Tests controller orchestration and decision logic:
 * - Champion display logic: getChampionData(), isTournamentOver(), shouldDisplayChampion()
 * - First row content: getFirstRowContent() with various tournament states
 * - Current match retrieval: getCurrentMatch()
 */
class MadnessControllerTest extends TestCase
{
    private MadnessController $controller;
    private \mysqli $mockDb;
    private ModernRockMadness $mockModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        
        $this->controller = new MadnessController($this->mockDb);
        
        // Get the model via reflection to mock it
        $reflection = new \ReflectionClass($this->controller);
        $modelProperty = $reflection->getProperty('mrmModel');
        $modelProperty->setAccessible(true);
        $this->mockModel = $this->createMock(ModernRockMadness::class);
        $modelProperty->setValue($this->controller, $this->mockModel);
    }

    /**
     * Test getChampionData returns null when no champion exists
     */
    public function testGetChampionDataReturnsNullWhenNoChampion(): void
    {
        $this->mockModel->method('getChampion')
            ->willReturn(null);

        $result = $this->controller->getChampionData();
        $this->assertNull($result);
    }

    /**
     * Test getChampionData returns champion info with tournament year
     */
    public function testGetChampionDataReturnsChampionInfo(): void
    {
        $championData = [
            'name' => 'Foo Fighters',
            'pic_url' => 'http://example.com/foo.jpg'
        ];
        
        $this->mockModel->method('getChampion')
            ->willReturn($championData);
        
        $this->mockModel->method('getTournamentYear')
            ->with(null)
            ->willReturn('2024');

        $result = $this->controller->getChampionData();
        
        $this->assertIsArray($result);
        $this->assertSame('Foo Fighters', $result['name']);
        $this->assertSame('http://example.com/foo.jpg', $result['pic_url']);
        $this->assertSame('2024', $result['year']);
    }

    /**
     * Test getChampionData uses provided tournament date
     */
    public function testGetChampionDataUsesProvidedTournamentDate(): void
    {
        $championData = [
            'name' => 'Pearl Jam',
            'pic_url' => 'http://example.com/pj.jpg'
        ];
        $tournamentDate = '2023-03-15';
        
        $this->mockModel->method('getChampion')
            ->willReturn($championData);
        
        $this->mockModel->method('getTournamentYear')
            ->with($tournamentDate)
            ->willReturn('2023');

        $result = $this->controller->getChampionData($tournamentDate);
        $this->assertSame('2023', $result['year']);
    }

    /**
     * Test isTournamentOver delegates to model
     */
    public function testIsTournamentOverDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('isTournamentOver')
            ->willReturn(true);

        $result = $this->controller->isTournamentOver();
        $this->assertTrue($result);
    }

    /**
     * Test isWaitingForFinal delegates to model
     */
    public function testIsWaitingForFinalDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('isWaitingForFinal')
            ->willReturn(false);

        $result = $this->controller->isWaitingForFinal();
        $this->assertFalse($result);
    }

    /**
     * Test getFirstRowContent returns champion type when tournament is over
     */
    public function testGetFirstRowContentReturnsChampionWhenTournamentOver(): void
    {
        $championData = [
            'name' => 'Nirvana',
            'pic_url' => 'http://example.com/nirvana.jpg',
            'year' => '2024'
        ];
        
        $this->mockModel->method('isTournamentOver')
            ->willReturn(true);
        
        $this->mockModel->method('getChampion')
            ->willReturn($championData);
        
        $this->mockModel->method('getTournamentYear')
            ->willReturn('2024');

        $result = $this->controller->getFirstRowContent();
        
        $this->assertIsArray($result);
        $this->assertSame('champion', $result['type']);
        $this->assertIsArray($result['data']);
        $this->assertSame('Nirvana', $result['data']['name']);
    }

    /**
     * Test getFirstRowContent returns waiting type when waiting for final
     */
    public function testGetFirstRowContentReturnsWaitingWhenWaitingForFinal(): void
    {
        $this->mockModel->method('isTournamentOver')
            ->willReturn(false);
        
        $this->mockModel->method('isWaitingForFinal')
            ->willReturn(true);

        $result = $this->controller->getFirstRowContent();
        
        $this->assertIsArray($result);
        $this->assertSame('waiting', $result['type']);
        $this->assertNull($result['data']);
    }

    /**
     * Test getFirstRowContent returns next_match type during tournament
     */
    public function testGetFirstRowContentReturnsNextMatchDuringTournament(): void
    {
        $tournamentDate = '2024-03-01';
        
        $this->mockModel->method('isTournamentOver')
            ->willReturn(false);
        
        $this->mockModel->method('isWaitingForFinal')
            ->willReturn(false);

        $result = $this->controller->getFirstRowContent($tournamentDate);
        
        $this->assertIsArray($result);
        $this->assertSame('next_match', $result['type']);
        $this->assertSame($tournamentDate, $result['data']);
    }

    /**
     * Test getCurrentMatch delegates to model
     */
    public function testGetCurrentMatchDelegatesToModel(): void
    {
        $matchData = [
            'id' => 15,
            'band1_id' => 5,
            'band2_id' => 12,
            'start_time' => '2024-03-15 18:00:00',
            'end_time' => '2024-03-15 20:00:00'
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getCurrentMatch')
            ->willReturn($matchData);

        $result = $this->controller->getCurrentMatch();
        $this->assertSame($matchData, $result);
    }

    /**
     * Test shouldDisplayChampion returns true when tournament over with champion
     */
    public function testShouldDisplayChampionReturnsTrueWhenChampionExists(): void
    {
        $this->mockModel->method('isTournamentOver')
            ->willReturn(true);
        
        $this->mockModel->method('getChampion')
            ->willReturn(['name' => 'Champion', 'pic_url' => 'pic.jpg']);
        
        $this->mockModel->method('getTournamentYear')
            ->willReturn('2024');

        $result = $this->controller->shouldDisplayChampion();
        $this->assertTrue($result);
    }

    /**
     * Test shouldDisplayChampion returns false when tournament not over
     */
    public function testShouldDisplayChampionReturnsFalseWhenTournamentNotOver(): void
    {
        $this->mockModel->method('isTournamentOver')
            ->willReturn(false);

        $result = $this->controller->shouldDisplayChampion();
        $this->assertFalse($result);
    }

    /**
     * Test shouldDisplayChampion returns false when no champion data
     */
    public function testShouldDisplayChampionReturnsFalseWhenNoChampionData(): void
    {
        $this->mockModel->method('isTournamentOver')
            ->willReturn(true);
        
        $this->mockModel->method('getChampion')
            ->willReturn(null);

        $result = $this->controller->shouldDisplayChampion();
        $this->assertFalse($result);
    }
}
