<?php

namespace YNotRadio\Tests\Controllers;

use YNotRadio\Tests\TestCase;
use YNotRadio\Controllers\MadnessAdminController;
use YNotRadio\Models\ModernRockMadnessAdmin;

/**
 * Tests for MadnessAdminController business logic
 * 
 * Tests admin controller orchestration:
 * - Band CRUD operations
 * - Match management
 * - Vote processing
 * - Status and formatting helpers
 */
class MadnessAdminControllerTest extends TestCase
{
    private MadnessAdminController $controller;
    private \mysqli $mockDb;
    private ModernRockMadnessAdmin $mockModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        
        $this->controller = new MadnessAdminController($this->mockDb);
        
        // Get the mrmAdmin model via reflection to mock it
        $reflection = new \ReflectionClass($this->controller);
        $modelProperty = $reflection->getProperty('mrmAdmin');
        $modelProperty->setAccessible(true);
        $this->mockModel = $this->createMock(ModernRockMadnessAdmin::class);
        $modelProperty->setValue($this->controller, $this->mockModel);
    }

    /**
     * Test addBand delegates to model with correct parameters
     */
    public function testAddBandDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('addBand')
            ->with('Foo Fighters', 'http://foo.com', 'http://foo.jpg', 1, 1, 'FF', 'Sponsor A')
            ->willReturn(42);

        $result = $this->controller->addBand('Foo Fighters', 'http://foo.com', 'http://foo.jpg', 1, 1, 'FF', 'Sponsor A');
        $this->assertSame(42, $result);
    }

    /**
     * Test addBand returns false on failure
     */
    public function testAddBandReturnsFalseOnFailure(): void
    {
        $this->mockModel->method('addBand')
            ->willReturn(false);

        $result = $this->controller->addBand('Band', 'url', 'pic', 1, 1, 'B', 'S');
        $this->assertFalse($result);
    }

    /**
     * Test getBand delegates to model
     */
    public function testGetBandDelegatesToModel(): void
    {
        $bandData = [
            'id' => 5,
            'name' => 'Pearl Jam',
            'url' => 'http://pj.com',
            'pic_url' => 'http://pj.jpg'
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getBand')
            ->with(5)
            ->willReturn($bandData);

        $result = $this->controller->getBand(5);
        $this->assertSame($bandData, $result);
    }

    /**
     * Test getBand returns null when not found
     */
    public function testGetBandReturnsNullWhenNotFound(): void
    {
        $this->mockModel->method('getBand')
            ->willReturn(null);

        $result = $this->controller->getBand(999);
        $this->assertNull($result);
    }

    /**
     * Test getBandName delegates to model
     */
    public function testGetBandNameDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('getBandName')
            ->with(10)
            ->willReturn('Nirvana');

        $result = $this->controller->getBandName(10);
        $this->assertSame('Nirvana', $result);
    }

    /**
     * Test deleteBand delegates to model
     */
    public function testDeleteBandDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('deleteBand')
            ->with(7)
            ->willReturn(true);

        $result = $this->controller->deleteBand(7);
        $this->assertTrue($result);
    }

    /**
     * Test updateBand delegates to model with all parameters
     */
    public function testUpdateBandDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('updateBand')
            ->with(3, 'Updated Band', 'http://new.com', 'http://new.jpg', 2, 3, 'UB', 'New Sponsor')
            ->willReturn(true);

        $result = $this->controller->updateBand(3, 'Updated Band', 'http://new.com', 'http://new.jpg', 2, 3, 'UB', 'New Sponsor');
        $this->assertTrue($result);
    }

    /**
     * Test getMatch delegates to model
     */
    public function testGetMatchDelegatesToModel(): void
    {
        $matchData = [
            'id' => 12,
            'band1_id' => 5,
            'band2_id' => 8,
            'start_time' => '2024-03-15 18:00:00'
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getMatch')
            ->with(12)
            ->willReturn($matchData);

        $result = $this->controller->getMatch(12);
        $this->assertSame($matchData, $result);
    }

    /**
     * Test updateSponsor delegates to model
     */
    public function testUpdateSponsorDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('updateSponsor')
            ->with(15, 'Sponsor X', 'Brought to you by Sponsor X')
            ->willReturn(true);

        $result = $this->controller->updateSponsor(15, 'Sponsor X', 'Brought to you by Sponsor X');
        $this->assertTrue($result);
    }

    /**
     * Test vote delegates to model with bypass flag
     */
    public function testVoteDelegatesToModelWithBypass(): void
    {
        $this->mockModel->expects($this->once())
            ->method('vote')
            ->with(20, 1, true)
            ->willReturn(true);

        $result = $this->controller->vote(20, 1, true);
        $this->assertTrue($result);
    }

    /**
     * Test vote without bypass flag
     */
    public function testVoteWithoutBypassFlag(): void
    {
        $this->mockModel->expects($this->once())
            ->method('vote')
            ->with(20, 2, false)
            ->willReturn(true);

        $result = $this->controller->vote(20, 2, false);
        $this->assertTrue($result);
    }

    /**
     * Test closeMatch delegates to model and returns winner
     */
    public function testCloseMatchDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('closeMatch')
            ->with(25)
            ->willReturn(7);

        $result = $this->controller->closeMatch(25);
        $this->assertSame(7, $result);
    }

    /**
     * Test closeMatch returns false on failure
     */
    public function testCloseMatchReturnsFalseOnFailure(): void
    {
        $this->mockModel->method('closeMatch')
            ->willReturn(false);

        $result = $this->controller->closeMatch(99);
        $this->assertFalse($result);
    }

    /**
     * Test now() delegates to model
     */
    public function testNowDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('now')
            ->willReturn('2024-03-15 14:30:00');

        $result = $this->controller->now();
        $this->assertSame('2024-03-15 14:30:00', $result);
    }

    /**
     * Test getCurrentMatch delegates to model
     */
    public function testGetCurrentMatchDelegatesToModel(): void
    {
        $matchData = [
            'id' => 18,
            'band1_id' => 3,
            'band2_id' => 9
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getCurrentMatch')
            ->willReturn($matchData);

        $result = $this->controller->getCurrentMatch();
        $this->assertSame($matchData, $result);
    }

    /**
     * Test calculateVotePercentage delegates to model
     */
    public function testCalculateVotePercentageDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('calculateVotePercentage')
            ->with(150, 100, 'block')
            ->willReturn('60%');

        $result = $this->controller->calculateVotePercentage(150, 100, 'block');
        $this->assertSame('60%', $result);
    }

    /**
     * Test getWinnerClass delegates to model
     */
    public function testGetWinnerClassDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('getWinnerClass')
            ->with(5, 12)
            ->willReturn(' winner');

        $result = $this->controller->getWinnerClass(5, 12);
        $this->assertSame(' winner', $result);
    }

    /**
     * Test getMatchStatus delegates to model
     */
    public function testGetMatchStatusDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('getMatchStatus')
            ->with(30)
            ->willReturn('running');

        $result = $this->controller->getMatchStatus(30);
        $this->assertSame('running', $result);
    }

    /**
     * Test isMatchTied delegates to model
     */
    public function testIsMatchTiedDelegatesToModel(): void
    {
        $match = [
            'band1_votes' => 100,
            'band2_votes' => 100
        ];
        
        $this->mockModel->expects($this->once())
            ->method('isMatchTied')
            ->with($match)
            ->willReturn(true);

        $result = $this->controller->isMatchTied($match);
        $this->assertTrue($result);
    }

    /**
     * Test getMatchesByRound delegates to model
     */
    public function testGetMatchesByRoundDelegatesToModel(): void
    {
        $matches = [
            ['id' => 1, 'band1_id' => 1, 'band2_id' => 2],
            ['id' => 2, 'band1_id' => 3, 'band2_id' => 4]
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getMatchesByRound')
            ->with(2)
            ->willReturn($matches);

        $result = $this->controller->getMatchesByRound(2);
        $this->assertSame($matches, $result);
    }

    /**
     * Test getBandAbbr delegates to model
     */
    public function testGetBandAbbrDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('getBandAbbr')
            ->with(15)
            ->willReturn('FF');

        $result = $this->controller->getBandAbbr(15);
        $this->assertSame('FF', $result);
    }
}
