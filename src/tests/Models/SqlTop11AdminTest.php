<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlTop11;

/**
 * Tests for SqlTop11 admin-specific operations
 * 
 * Tests admin operations not covered in Basic/Extended tests:
 * - pickWinner: Random contestant selection for contests
 * - reset: Full data reset (nuke) operation
 * - getNewsletterSignups: Newsletter subscribers retrieval
 * - update: Update Top11 chart entries (placement/artist/song/note)
 * - updateDate: Update voting period date
 * - recordUserVote: Track that a user has voted
 * - getById: Retrieve specific Top11 entries
 * - getAll: Retrieve all Top11 entries
 * - addSong: Add new song to voting pool
 * - getContestantCount: Count eligible contestants
 */
class SqlTop11AdminTest extends TestCase
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
     * Test pickWinner returns random contestant
     */
    public function testPickWinnerReturnsRandomContestant(): void
    {
        $contestant = ['id' => 1, 'firstname' => 'Jane', 'lastname' => 'Smith', 'email' => 'jane@example.com'];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn($contestant);

        $this->mockDb->method('query')
            ->willReturn($mockResult);

        $result = $this->top11->pickWinner();
        $this->assertSame($contestant, $result);
    }

    /**
     * Test pickWinner throws exception when no contestants
     */
    public function testPickWinnerThrowsExceptionWhenNoContestants(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(null);

        $this->mockDb->method('query')
            ->willReturn($mockResult);

        $this->expectException(\Exception::class);
        $this->top11->pickWinner();
    }

    /**
     * Test reset clears all voting data
     */
    public function testResetClearsAllVotingData(): void
    {
        $expectedQueries = [
            "UPDATE top11songs SET value = 0",
            "UPDATE write_in SET deleted = 'yes'",
            "UPDATE top11contest SET display = 'no'",
            "UPDATE ip_address SET deleted = 'yes'",
            "DELETE FROM top11_user_votes"
        ];

        $this->mockDb->expects($this->exactly(5))
            ->method('query')
            ->willReturnCallback(function ($query) use ($expectedQueries) {
                static $callIndex = 0;
                $this->assertSame($expectedQueries[$callIndex], $query);
                $callIndex++;
                return true;
            });

        $result = $this->top11->reset();
        $this->assertTrue($result);
    }

    /**
     * Test reset returns false if any query fails
     */
    public function testResetReturnsFalseOnFailure(): void
    {
        $this->mockDb->method('query')
            ->willReturnOnConsecutiveCalls(true, false, true, true, true);

        $result = $this->top11->reset();
        $this->assertFalse($result);
    }

    /**
     * Test getNewsletterSignups returns newsletter-only subscribers
     */
    public function testGetNewsletterSignupsReturnsNewsletterOnly(): void
    {
        $signups = [
            ['id' => 10, 'firstname' => 'News', 'lastname' => 'Reader', 'email' => 'news@example.com', 'contest' => 'no', 'newsletter' => 'yes'],
            ['id' => 11, 'firstname' => 'Sub', 'lastname' => 'Scriber', 'email' => 'sub@example.com', 'contest' => 'no', 'newsletter' => 'yes']
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($signups[0], $signups[1], null);

        $this->mockDb->method('query')
            ->with("SELECT * FROM top11contest WHERE contest = 'no' AND newsletter = 'yes' AND display = 'yes' ORDER BY id")
            ->willReturn($mockResult);

        $result = $this->top11->getNewsletterSignups();
        $this->assertCount(2, $result);
        $this->assertSame('no', $result[0]['contest']);
        $this->assertSame('yes', $result[0]['newsletter']);
    }

    /**
     * Test update modifies Top11 chart entry
     */
    public function testUpdateModifiesChartEntry(): void
    {
        $placement = 1;
        $artist = 'Updated Artist';
        $song = 'Updated Song';
        $note = 'New entry';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sssi', $artist, $song, $note, $placement);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11 SET artist = ?, song = ?, note = ? WHERE placement = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->update($placement, $artist, $song, $note);
        $this->assertTrue($result);
    }

    /**
     * Test updateDate sets new voting period
     */
    public function testUpdateDateSetsNewVotingPeriod(): void
    {
        $newDate = '2024-02-01';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $newDate);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11 SET artist = ? WHERE placement = 99")
            ->willReturn($mockStmt);

        $result = $this->top11->updateDate($newDate);
        $this->assertTrue($result);
    }

    /**
     * Test recordUserVote successfully records vote
     */
    public function testRecordUserVoteSuccess(): void
    {
        $userEmail = 'voter@example.com';
        $auth0Id = 'auth0|123456';
        $currentPeriod = '2024-01-15';

        // Mock getCurrentVotingWeek call
        $mockPeriodResult = $this->createMock(\mysqli_result::class);
        $mockPeriodResult->method('fetch_assoc')
            ->willReturn(['artist' => $currentPeriod]);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('sss', $userEmail, $currentPeriod, $auth0Id);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 99")
            ->willReturn($mockPeriodResult);

        $this->mockDb->method('prepare')
            ->with("INSERT INTO top11_user_votes (user_email, voting_period, user_auth0_id) VALUES (?, ?, ?)")
            ->willReturn($mockStmt);

        $result = $this->top11->recordUserVote($userEmail, $auth0Id);
        $this->assertTrue($result);
    }

    /**
     * Test recordUserVote returns false when execute fails
     */
    public function testRecordUserVoteReturnsFalseOnExecuteFailure(): void
    {
        $userEmail = 'voter@example.com';
        $auth0Id = 'auth0|123456';
        $currentPeriod = '2024-01-15';

        $mockPeriodResult = $this->createMock(\mysqli_result::class);
        $mockPeriodResult->method('fetch_assoc')
            ->willReturn(['artist' => $currentPeriod]);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('bind_param');
        $mockStmt->method('execute')->willReturn(false);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 99")
            ->willReturn($mockPeriodResult);

        $this->mockDb->method('prepare')
            ->with("INSERT INTO top11_user_votes (user_email, voting_period, user_auth0_id) VALUES (?, ?, ?)")
            ->willReturn($mockStmt);

        $result = $this->top11->recordUserVote($userEmail, $auth0Id);
        $this->assertFalse($result);
    }

    /**
     * Test getAll returns all Top11 entries
     */
    public function testGetAllReturnsAllEntries(): void
    {
        $entries = [
            ['placement' => 1, 'artist' => 'Artist 1', 'song' => 'Song 1'],
            ['placement' => 2, 'artist' => 'Artist 2', 'song' => 'Song 2'],
            ['placement' => 3, 'artist' => 'Artist 3', 'song' => 'Song 3']
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($entries[0], $entries[1], $entries[2], null);

        $this->mockDb->method('query')
            ->with("SELECT * FROM top11")
            ->willReturn($mockResult);

        $result = $this->top11->getAll();
        $this->assertCount(3, $result);
        $this->assertSame($entries, $result);
    }

    /**
     * Test getAll throws exception on query failure
     */
    public function testGetAllThrowsExceptionOnFailure(): void
    {
        $this->mockDb->method('query')
            ->willReturn(false);

        $this->expectException(\Exception::class);
        $this->top11->getAll();
    }

    /**
     * Test addSong inserts new song and returns ID
     */
    public function testAddSongInsertsNewSong(): void
    {
        $artist = 'The Beatles';
        $song = 'Hey Jude';
        $expectedId = 42;

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('ss', $artist, $song);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("INSERT INTO top11songs (artist, song, value, deleted) VALUES (?, ?, 0, 'n')")
            ->willReturn($mockStmt);

        $top11 = $this->getMockBuilder(\YNotRadio\Models\Implementations\SqlTop11::class)
            ->setConstructorArgs([$this->mockDb])
            ->onlyMethods(['getLastInsertId'])
            ->getMock();
        $top11->method('getLastInsertId')->willReturn($expectedId);

        $result = $top11->addSong($artist, $song);
        $this->assertSame($expectedId, $result);
    }

    /**
     * Test addSong throws exception on failure
     */
    public function testAddSongThrowsExceptionOnFailure(): void
    {
        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('bind_param');
        $mockStmt->method('execute')->willReturn(false);

        $this->mockDb->method('prepare')
            ->willReturn($mockStmt);

        $this->expectException(\Exception::class);
        $this->top11->addSong('Artist', 'Song');
    }

    /**
     * Test getContestantCount returns formatted count
     */
    public function testGetContestantCountReturnsFormattedCount(): void
    {
        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn(['total' => 5]);

        $this->mockDb->method('query')
            ->with("SELECT COUNT(*) as total FROM top11contest WHERE display = 'yes' AND contest = 'yes'")
            ->willReturn($mockResult);

        $result = $this->top11->getContestantCount();
        $this->assertSame('(5 total entries)', $result);
    }

    /**
     * Test getById returns specific entry
     */
    public function testGetByIdReturnsSpecificEntry(): void
    {
        $id = 5;
        $entry = ['placement' => 5, 'artist' => 'Test Artist', 'song' => 'Test Song'];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn($entry);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('get_result')->willReturn($mockResult);

        $this->mockDb->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->top11->getById($id);
        $this->assertSame($entry, $result);
    }

    /**
     * Test getById returns null when query returns false
     */
    public function testGetByIdReturnsNullWhenQueryFails(): void
    {
        $id = 999;

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('execute')
            ->willReturn(true);
        $mockStmt->method('get_result')
            ->willReturn(false);

        $this->mockDb->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->top11->getById($id);
        $this->assertNull($result);
    }
}
