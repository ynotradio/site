<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlTop11;

/**
 * Extended tests for SqlTop11 song and contestant operations
 * 
 * Tests song management, voting, contestant operations, and write-ins:
 * - Song CRUD: add, update, delete, get, getAll
 * - Voting: addVote
 * - Contestants: add, getAll, getContestantCount
 * - Write-ins: add, getAll
 * - Voting checks: hasUserVotedThisWeek
 */
class SqlTop11ExtendedTest extends TestCase
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
     * Test updateSong successfully updates song details
     */
    public function testUpdateSongSuccess(): void
    {
        $songId = 5;
        $artist = 'The Beatles';
        $song = 'Hey Jude';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('ssi', $artist, $song, $songId);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11songs SET artist = ?, song = ? WHERE id = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->updateSong($songId, $artist, $song);
        $this->assertTrue($result);
    }

    /**
     * Test deleteSong marks song as deleted
     */
    public function testDeleteSongMarksDeleted(): void
    {
        $songId = 10;

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('i', $songId);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11songs SET deleted = 'y' WHERE id = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->deleteSong($songId);
        $this->assertTrue($result);
    }

    /**
     * Test getSong returns song data when found
     */
    public function testGetSongReturnsData(): void
    {
        $songId = 5;
        $song = ['id' => 5, 'artist' => 'The Beatles', 'song' => 'Hey Jude'];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturn($song);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('get_result')->willReturn($mockResult);

        $this->mockDb->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->top11->getSong($songId);
        $this->assertSame($song, $result);
    }

    /**
     * Test getSong returns null when query returns false
     */
    public function testGetSongReturnsNullWhenQueryFails(): void
    {
        $songId = 999;

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        
        $mockStmt->method('execute')
            ->willReturn(true);
        // Return false from get_result to simulate query failure
        $mockStmt->method('get_result')
            ->willReturn(false);

        $this->mockDb->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->top11->getSong($songId);
        $this->assertNull($result);
    }

    /**
     * Test getAllSongs returns only non-deleted songs ordered by artist
     */
    public function testGetAllSongsReturnsNonDeletedOrdered(): void
    {
        $songs = [
            ['id' => 1, 'artist' => 'Artist A', 'song' => 'Song 1'],
            ['id' => 2, 'artist' => 'Artist B', 'song' => 'Song 2'],
            ['id' => 3, 'artist' => 'Artist C', 'song' => 'Song 3']
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($songs[0], $songs[1], $songs[2], null);

        $this->mockDb->method('query')
            ->with("SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist")
            ->willReturn($mockResult);

        $result = $this->top11->getAllSongs();
        $this->assertCount(3, $result);
        $this->assertSame($songs, $result);
    }

    /**
     * Test addVote increments vote count for a song
     */
    public function testAddVoteIncrementsCount(): void
    {
        $songId = 7;

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('i', $songId);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("UPDATE top11songs SET value = value + 1 WHERE id = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->addVote($songId);
        $this->assertTrue($result);
    }

    /**
     * Test addContestant successfully adds contestant entry
     */
    public function testAddContestantSuccess(): void
    {
        $firstname = 'John';
        $lastname = 'Doe';
        $email = 'john@example.com';
        $phone = '555-1234';
        $contest = 'yes';
        $newsletter = 'yes';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('ssssss', $firstname, $lastname, $email, $phone, $contest, $newsletter);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("INSERT INTO top11contest (firstname, lastname, email, phone, contest, newsletter, display) VALUES (?, ?, ?, ?, ?, ?, 'yes')")
            ->willReturn($mockStmt);

        $result = $this->top11->addContestant($firstname, $lastname, $email, $phone, $contest, $newsletter);
        $this->assertTrue($result);
    }

    /**
     * Test getAllContestants returns only eligible contestants
     */
    public function testGetAllContestantsReturnsEligible(): void
    {
        $contestants = [
            ['id' => 1, 'firstname' => 'Jane', 'lastname' => 'Smith'],
            ['id' => 2, 'firstname' => 'Bob', 'lastname' => 'Johnson']
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($contestants[0], $contestants[1], null);

        $this->mockDb->method('query')
            ->with("SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes' ORDER BY id")
            ->willReturn($mockResult);

        $result = $this->top11->getAllContestants();
        $this->assertCount(2, $result);
        $this->assertSame($contestants, $result);
    }

    /**
     * Test addWriteIn successfully stores write-in vote
     */
    public function testAddWriteInSuccess(): void
    {
        $writeIn = 'My Favorite Band - My Favorite Song';

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->expects($this->once())
            ->method('bind_param')
            ->with('s', $writeIn);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);

        $this->mockDb->method('prepare')
            ->with("INSERT INTO write_in (write_in, deleted) VALUES (?, 'no')")
            ->willReturn($mockStmt);

        $result = $this->top11->addWriteIn($writeIn);
        $this->assertTrue($result);
    }

    /**
     * Test getAllWriteIns returns only non-deleted entries
     */
    public function testGetAllWriteInsReturnsNonDeleted(): void
    {
        $writeIns = [
            ['id' => 1, 'write_in' => 'Write-in 1', 'deleted' => 'no'],
            ['id' => 2, 'write_in' => 'Write-in 2', 'deleted' => 'no']
        ];

        $mockResult = $this->createMock(\mysqli_result::class);
        $mockResult->method('fetch_assoc')
            ->willReturnOnConsecutiveCalls($writeIns[0], $writeIns[1], null);

        $this->mockDb->method('query')
            ->with("SELECT * FROM write_in WHERE deleted = 'no' ORDER BY id")
            ->willReturn($mockResult);

        $result = $this->top11->getAllWriteIns();
        $this->assertCount(2, $result);
        $this->assertSame($writeIns, $result);
    }

    /**
     * Test hasUserVotedThisWeek returns true when user has voted
     */
    public function testHasUserVotedThisWeekReturnsTrue(): void
    {
        $userEmail = 'user@example.com';
        $currentPeriod = '2024-01-15';

        // Mock getCurrentVotingWeek call
        $mockPeriodResult = $this->createMock(\mysqli_result::class);
        $mockPeriodResult->method('fetch_assoc')
            ->willReturn(['artist' => $currentPeriod]);

        // Mock hasUserVotedThisWeek query
        $mockVoteResult = $this->createMock(\mysqli_result::class);
        $mockVoteResult->method('fetch_assoc')
            ->willReturn(['count' => 1]);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('bind_param')
            ->with('ss', $userEmail, $currentPeriod);
        $mockStmt->method('execute')
            ->willReturn(true);
        $mockStmt->method('get_result')
            ->willReturn($mockVoteResult);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 99")
            ->willReturn($mockPeriodResult);

        $this->mockDb->method('prepare')
            ->with("SELECT COUNT(*) as count FROM top11_user_votes WHERE user_email = ? AND voting_period = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->hasUserVotedThisWeek($userEmail);
        $this->assertTrue($result);
    }

    /**
     * Test hasUserVotedThisWeek returns false when user has not voted
     */
    public function testHasUserVotedThisWeekReturnsFalse(): void
    {
        $userEmail = 'newuser@example.com';
        $currentPeriod = '2024-01-15';

        // Mock getCurrentVotingWeek call
        $mockPeriodResult = $this->createMock(\mysqli_result::class);
        $mockPeriodResult->method('fetch_assoc')
            ->willReturn(['artist' => $currentPeriod]);

        // Mock hasUserVotedThisWeek query
        $mockVoteResult = $this->createMock(\mysqli_result::class);
        $mockVoteResult->method('fetch_assoc')
            ->willReturn(['count' => 0]);

        $mockStmt = $this->createMock(\mysqli_stmt::class);
        $mockStmt->method('bind_param')
            ->with('ss', $userEmail, $currentPeriod);
        $mockStmt->method('execute')
            ->willReturn(true);
        $mockStmt->method('get_result')
            ->willReturn($mockVoteResult);

        $this->mockDb->method('query')
            ->with("SELECT artist FROM top11 WHERE placement = 99")
            ->willReturn($mockPeriodResult);

        $this->mockDb->method('prepare')
            ->with("SELECT COUNT(*) as count FROM top11_user_votes WHERE user_email = ? AND voting_period = ?")
            ->willReturn($mockStmt);

        $result = $this->top11->hasUserVotedThisWeek($userEmail);
        $this->assertFalse($result);
    }
}
