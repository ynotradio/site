<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlTop11;

/**
 * Tests for SqlTop11 basic operations
 * 
 * Tests configuration and status methods:
 * - getStatus: Retrieve voting open/closed status
 * - toggleStatus: Open/close voting
 * - getMessage: Message retrieval
 * - updateMessage: Message updates
 * - getCurrentVotingWeek: Voting period identifier
 */
class SqlTop11BasicTest extends TestCase
{
    private SqlTop11 $top11;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->top11 = new SqlTop11($this->mockDb);
    }

    /**
     * Test getStatus returns 'open' when voting is open
     */
    public function testGetStatusReturnsOpen(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(['artist' => 'open']);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 98")
            ->willReturn($mockResult);

        $result = $this->top11->getStatus();
        $this->assertSame('open', $result);
    }

    /**
     * Test getStatus returns 'closed' when voting is closed
     */
    public function testGetStatusReturnsClosed(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(['artist' => 'closed']);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 98")
            ->willReturn($mockResult);

        $result = $this->top11->getStatus();
        $this->assertSame('closed', $result);
    }

    /**
     * Test toggleStatus closes voting when currently open
     */
    public function testToggleStatusClosesVoting(): void
    {
        $this->mockDb->expects($this->once())
            ->method('query')
            ->with("UPDATE top11 SET artist = 'closed' WHERE placement = 98")
            ->willReturn(true);

        $result = $this->top11->toggleStatus('open');
        $this->assertTrue($result);
    }

    /**
     * Test toggleStatus opens voting when currently closed
     */
    public function testToggleStatusOpensVoting(): void
    {
        $this->mockDb->expects($this->once())
            ->method('query')
            ->with("UPDATE top11 SET artist = 'open' WHERE placement = 98")
            ->willReturn(true);

        $result = $this->top11->toggleStatus('closed');
        $this->assertTrue($result);
    }

    /**
     * Test getMessage retrieves message data
     */
    public function testGetMessageRetrievesData(): void
    {
        $expectedMessage = [
            'id' => 1,
            'message' => 'Vote for your favorite songs!'
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn($expectedMessage);

        $this->mockDb->method('query')
            ->with("SELECT * FROM top11message WHERE id = 1")
            ->willReturn($mockResult);

        $result = $this->top11->getMessage();
        $this->assertSame($expectedMessage, $result);
    }

    /**
     * Test updateMessage updates message successfully
     */
    public function testUpdateMessageSuccess(): void
    {
        $newMessage = 'New voting message';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $newMessage);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11message SET message = ? WHERE id = 1")
            ->willReturn($mockStmt);

        $result = $this->top11->updateMessage($newMessage);
        $this->assertTrue($result);
    }

    /**
     * Test getCurrentVotingWeek returns current period identifier
     */
    public function testGetCurrentVotingWeekReturnsIdentifier(): void
    {
        $expectedPeriod = '2024-01-15';

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(['artist' => $expectedPeriod]);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 99")
            ->willReturn($mockResult);

        $result = $this->top11->getCurrentVotingWeek();
        $this->assertSame($expectedPeriod, $result);
    }

    /**
     * Test getCurrentVotingWeek returns 'current' when artist field is null
     */
    public function testGetCurrentVotingWeekWithNullArtist(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(['artist' => null]);

        $this->mockDb->method('query')
            ->willReturn($mockResult);

        // When artist field is null, getCurrentVotingWeek returns 'current'
        $result = $this->top11->getCurrentVotingWeek();
        $this->assertSame('current', $result);
    }
}
