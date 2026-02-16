<?php

namespace YNotRadio\Tests\Controllers;

use YNotRadio\Tests\TestCase;
use YNotRadio\Controllers\YearEndPollController;
use YNotRadio\Models\YearEndPoll;

/**
 * Tests for YearEndPollController business logic
 * 
 * Tests controller orchestration and business logic:
 * - Poll management: getPollNames(), getPollValues(), formatPollName()
 * - Voting status: hasVoted(), getPollClass(), createPollLink()
 * - Contest eligibility: canEnterContest(), hasEnteredContest() methods
 * - Vote processing: processVotes() orchestration logic
 */
class YearEndPollControllerTest extends TestCase
{
    private YearEndPollController $controller;
    private \mysqli $mockDb;
    private YearEndPoll $mockModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        
        $this->controller = new YearEndPollController($this->mockDb);
        
        // Get the model via reflection to mock it
        $reflection = new \ReflectionClass($this->controller);
        $modelProperty = $reflection->getProperty('pollModel');
        $modelProperty->setAccessible(true);
        $this->mockModel = $this->createMock(YearEndPoll::class);
        $modelProperty->setValue($this->controller, $this->mockModel);
    }

    /**
     * Test getPollNames delegates to model
     */
    public function testGetPollNamesDelegatesToModel(): void
    {
        $expectedPolls = ['album', 'song', 'artist', 'concert'];
        
        $this->mockModel->expects($this->once())
            ->method('getPollNames')
            ->willReturn($expectedPolls);

        $result = $this->controller->getPollNames();
        $this->assertSame($expectedPolls, $result);
    }

    /**
     * Test getPollValues delegates to model
     */
    public function testGetPollValuesDelegatesToModel(): void
    {
        $pollName = 'album';
        $expectedValues = [
            ['id' => 1, 'value' => 'Album 1'],
            ['id' => 2, 'value' => 'Album 2']
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getPollValues')
            ->with($pollName)
            ->willReturn($expectedValues);

        $result = $this->controller->getPollValues($pollName);
        $this->assertSame($expectedValues, $result);
    }

    /**
     * Test hasVoted delegates to model
     */
    public function testHasVotedDelegatesToModel(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->expects($this->once())
            ->method('hasVoted')
            ->with($ip, $pollName)
            ->willReturn(true);

        $result = $this->controller->hasVoted($ip, $pollName);
        $this->assertTrue($result);
    }

    /**
     * Test formatPollName delegates to model
     */
    public function testFormatPollNameDelegatesToModel(): void
    {
        $pollName = 'best_album';
        $formattedName = 'Best Album';
        
        $this->mockModel->expects($this->once())
            ->method('formatPollName')
            ->with($pollName)
            ->willReturn($formattedName);

        $result = $this->controller->formatPollName($pollName);
        $this->assertSame($formattedName, $result);
    }

    /**
     * Test getPollClass returns base class when not voted
     */
    public function testGetPollClassReturnsBaseClassWhenNotVoted(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->with($ip, $pollName)
            ->willReturn(false);

        $result = $this->controller->getPollClass($ip, $pollName);
        $this->assertSame('poll', $result);
    }

    /**
     * Test getPollClass adds completed class when voted
     */
    public function testGetPollClassAddsCompletedWhenVoted(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->with($ip, $pollName)
            ->willReturn(true);

        $result = $this->controller->getPollClass($ip, $pollName);
        $this->assertSame('poll completed ', $result);
    }

    /**
     * Test getPollClass adds current class when poll is current
     */
    public function testGetPollClassAddsCurrentWhenCurrent(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->willReturn(false);

        $result = $this->controller->getPollClass($ip, $pollName, $pollName);
        $this->assertSame('poll current', $result);
    }

    /**
     * Test getPollClass combines completed and current classes
     */
    public function testGetPollClassCombinesCompletedAndCurrent(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->willReturn(true);

        $result = $this->controller->getPollClass($ip, $pollName, $pollName);
        $this->assertSame('poll completed  current', $result);
    }

    /**
     * Test createPollLink returns base URL when already voted
     */
    public function testCreatePollLinkReturnsBaseWhenVoted(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->with($ip, $pollName)
            ->willReturn(true);

        $result = $this->controller->createPollLink($ip, $pollName);
        $this->assertSame('yearendpoll.php', $result);
    }

    /**
     * Test createPollLink returns poll-specific URL when not voted
     */
    public function testCreatePollLinkReturnsPollUrlWhenNotVoted(): void
    {
        $ip = '192.168.1.1';
        $pollName = 'album';
        
        $this->mockModel->method('hasVoted')
            ->with($ip, $pollName)
            ->willReturn(false);

        $result = $this->controller->createPollLink($ip, $pollName);
        $this->assertSame('yearendpoll.php?poll=album', $result);
    }

    /**
     * Test canEnterContest delegates to model
     */
    public function testCanEnterContestDelegatesToModel(): void
    {
        $ip = '192.168.1.1';
        
        $this->mockModel->expects($this->once())
            ->method('canEnterContest')
            ->with($ip)
            ->willReturn(true);

        $result = $this->controller->canEnterContest($ip);
        $this->assertTrue($result);
    }

    /**
     * Test hasEnteredContest delegates to model
     */
    public function testHasEnteredContestDelegatesToModel(): void
    {
        $ip = '192.168.1.1';
        
        $this->mockModel->expects($this->once())
            ->method('hasEnteredContest')
            ->with($ip)
            ->willReturn(false);

        $result = $this->controller->hasEnteredContest($ip);
        $this->assertFalse($result);
    }

    /**
     * Test hasEnteredContestByEmail delegates to model
     */
    public function testHasEnteredContestByEmailDelegatesToModel(): void
    {
        $email = 'test@example.com';
        
        $this->mockModel->expects($this->once())
            ->method('hasEnteredContestByEmail')
            ->with($email)
            ->willReturn(false);

        $result = $this->controller->hasEnteredContestByEmail($email);
        $this->assertFalse($result);
    }

    /**
     * Test hasEnteredContestByPhone delegates to model
     */
    public function testHasEnteredContestByPhoneDelegatesToModel(): void
    {
        $phone = '555-1234';
        
        $this->mockModel->expects($this->once())
            ->method('hasEnteredContestByPhone')
            ->with($phone)
            ->willReturn(false);

        $result = $this->controller->hasEnteredContestByPhone($phone);
        $this->assertFalse($result);
    }
}
