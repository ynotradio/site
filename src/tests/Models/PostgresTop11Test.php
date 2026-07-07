<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresTop11;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresTop11 -- the adapter behind top11.php once
 * use_postgres_top11 is enabled.
 *
 * Covers the read/write paths top11.php and _top11_save.php actually call
 * (getMessage, getAll, getStatus, getAllSongs, hasUserVotedThisWeek,
 * recordUserVote, addContestant, addVote, addWriteIn) plus the CP-only
 * methods, which are intentionally unsupported (Payload's Contest Controls
 * tab supersedes the legacy CP screens that would call them).
 */
class PostgresTop11Test extends TestCase
{
    private PostgresTop11 $top11;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->top11 = new PostgresTop11($this->mockDb);
    }

    private function lexical(string $text): string
    {
        return json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [['type' => 'text', 'text' => $text]],
                    ],
                ],
            ],
        ]);
    }

    private function stubActiveContest(int $contestId): PDOStatement
    {
        $contestStmt = $this->createMock(PDOStatement::class);
        $contestStmt->method('execute')->willReturn(true);
        $contestStmt->method('fetch')->willReturn(['id' => $contestId]);
        return $contestStmt;
    }

    public function testGetMessageRendersLexicalToHtml(): void
    {
        $contestStmt = $this->stubActiveContest(1);

        $messageStmt = $this->createMock(PDOStatement::class);
        $messageStmt->method('execute')->willReturn(true);
        $messageStmt->method('fetch')->willReturn([
            'message_snapshot_headline' => 'Top 11 @ 11 for June 25, 2026',
            'message_snapshot_body' => $this->lexical('Vote for your favorites'),
        ]);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $messageStmt);

        $result = $this->top11->getMessage();

        $this->assertStringContainsString('Vote for your favorites', $result['message']);
    }

    public function testGetMessageReturnsEmptyWhenNoActiveContest(): void
    {
        $noContestStmt = $this->createMock(PDOStatement::class);
        $noContestStmt->method('execute')->willReturn(true);
        $noContestStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($noContestStmt);

        $result = $this->top11->getMessage();

        $this->assertSame('', $result['message']);
    }

    public function testGetStatusReturnsOpenWhenContestIsOpen(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $statusStmt = $this->createMock(PDOStatement::class);
        $statusStmt->method('execute')->willReturn(true);
        $statusStmt->method('fetch')->willReturn(['status' => 'open']);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $statusStmt);

        $this->assertSame('open', $this->top11->getStatus());
    }

    public function testGetStatusReturnsClosedWhenContestIsNotOpen(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $statusStmt = $this->createMock(PDOStatement::class);
        $statusStmt->method('execute')->willReturn(true);
        $statusStmt->method('fetch')->willReturn(['status' => 'closed']);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $statusStmt);

        $this->assertSame('closed', $this->top11->getStatus());
    }

    public function testGetAllFormatsWeekOfWithoutAWeekdayToMatchLegacyMysql(): void
    {
        // SqlTop11::getAll() returns legacy MySQL's placement-99 row verbatim
        // (e.g. "July 2, 2026", no weekday) -- PostgresTop11 must match that
        // exact string shape since top11.php renders it directly into the
        // "Top 11 @ 11 for {this}" heading.
        $contestStmt = $this->stubActiveContest(1);

        $entriesStmt = $this->createMock(PDOStatement::class);
        $entriesStmt->method('execute')->willReturn(true);
        $entriesStmt->method('fetch')->willReturn(false);

        $weekOfStmt = $this->createMock(PDOStatement::class);
        $weekOfStmt->method('execute')->willReturn(true);
        $weekOfStmt->method('fetch')->willReturn(['week_of' => '2026-07-02', 'status' => 'open']);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $entriesStmt, $weekOfStmt);

        $entries = $this->top11->getAll();

        $titleRow = array_values(array_filter($entries, fn ($e) => $e['placement'] === 99))[0];
        $this->assertSame('July 2, 2026', $titleRow['artist']);
    }

    public function testGetAllSongsReturnsNomineePoolNotEntries(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $nomineesStmt = $this->createMock(PDOStatement::class);
        $nomineesStmt->method('execute')->willReturn(true);
        $nomineesStmt->method('fetch')->willReturnOnConsecutiveCalls(
            ['id' => 10, 'song' => 'Chance To Bleed', 'artist' => 'Kurt Vile'],
            ['id' => 20, 'song' => 'Sun Has Set', 'artist' => 'beabadoobee'],
            false,
        );

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $nomineesStmt);

        $songs = $this->top11->getAllSongs();

        $this->assertCount(2, $songs);
        $this->assertSame(['id' => 10, 'song' => 'Chance To Bleed', 'artist' => 'Kurt Vile'], $songs[0]);
    }

    public function testGetAllSongsReturnsEmptyWhenNoActiveContest(): void
    {
        $noContestStmt = $this->createMock(PDOStatement::class);
        $noContestStmt->method('execute')->willReturn(true);
        $noContestStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($noContestStmt);

        $this->assertSame([], $this->top11->getAllSongs());
    }

    public function testAddVoteRejectsASongNotInTheNomineePool(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $nomineeCheckStmt = $this->createMock(PDOStatement::class);
        $nomineeCheckStmt->method('execute')->willReturn(true);
        $nomineeCheckStmt->method('fetch')->willReturn(false);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $nomineeCheckStmt);

        $this->expectExceptionMessage('This song is not on the ballot for this contest');
        $this->top11->addVote(999);
    }

    public function testAddVoteInsertsAVoteForANomineeSong(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $nomineeCheckStmt = $this->createMock(PDOStatement::class);
        $nomineeCheckStmt->method('execute')->willReturn(true);
        $nomineeCheckStmt->method('fetch')->willReturn(['1' => 1]);

        $insertStmt = $this->createMock(PDOStatement::class);
        $insertStmt->expects($this->once())
            ->method('execute')
            ->with($this->callback(function (array $params) {
                return $params[':contest_id'] === 1 && $params[':song_id'] === 10;
            }))
            ->willReturn(true);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls(
            $contestStmt,
            $nomineeCheckStmt,
            $insertStmt,
        );

        $this->top11->pendingVoterEmail = 'jane@example.com';
        $result = $this->top11->addVote(10);

        $this->assertTrue($result);
    }

    public function testAddVoteThrowsWithNoActiveContest(): void
    {
        $noContestStmt = $this->createMock(PDOStatement::class);
        $noContestStmt->method('execute')->willReturn(true);
        $noContestStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($noContestStmt);

        $this->expectExceptionMessage('No active Top 11 contest to vote in');
        $this->top11->addVote(10);
    }

    public function testRecordUserVoteStoresVoterIdentityForSubsequentAddVoteCalls(): void
    {
        $result = $this->top11->recordUserVote('jane@example.com', 'auth0|123');

        $this->assertTrue($result);
        $this->assertSame('jane@example.com', $this->top11->pendingVoterEmail);
        $this->assertSame('auth0|123', $this->top11->pendingVoterAuth0Id);
    }

    public function testHasUserVotedThisWeekReturnsFalseWithNoActiveContest(): void
    {
        $noContestStmt = $this->createMock(PDOStatement::class);
        $noContestStmt->method('execute')->willReturn(true);
        $noContestStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($noContestStmt);

        $this->assertFalse($this->top11->hasUserVotedThisWeek('jane@example.com'));
    }

    public function testHasUserVotedThisWeekReturnsFalseForEmptyEmail(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $this->mockDb->method('prepare')->willReturn($contestStmt);

        $this->assertFalse($this->top11->hasUserVotedThisWeek(''));
    }

    public function testHasUserVotedThisWeekReturnsTrueWhenAVoteExists(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $voteCheckStmt = $this->createMock(PDOStatement::class);
        $voteCheckStmt->method('execute')->willReturn(true);
        $voteCheckStmt->method('fetch')->willReturn(['1' => 1]);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $voteCheckStmt);

        $this->assertTrue($this->top11->hasUserVotedThisWeek('jane@example.com'));
    }

    public function testAddContestantInsertsAContestantRow(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $insertStmt = $this->createMock(PDOStatement::class);
        $insertStmt->expects($this->once())
            ->method('execute')
            // Bind as the 'true'/'false' string literals, not native PHP
            // bools: PDO's native (non-emulated) pgsql prepares raised
            // "invalid input syntax for type boolean" on a real Neon branch
            // when passing a native bool for entered_contest/newsletter_opt_in
            // -- confirmed only by testing against real Postgres, not mocks.
            ->with($this->callback(function (array $params) {
                return $params[':first_name'] === 'Jane'
                    && $params[':entered_contest'] === 'true'
                    && $params[':newsletter_opt_in'] === 'false';
            }))
            ->willReturn(true);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $insertStmt);

        $result = $this->top11->addContestant('Jane', 'Doe', 'jane@example.com', '555-1234', 'yes', 'no');

        $this->assertTrue($result);
    }

    public function testAddContestantBindsTheInverseBooleanCombination(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $insertStmt = $this->createMock(PDOStatement::class);
        $insertStmt->expects($this->once())
            ->method('execute')
            ->with($this->callback(function (array $params) {
                return $params[':entered_contest'] === 'false'
                    && $params[':newsletter_opt_in'] === 'true';
            }))
            ->willReturn(true);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $insertStmt);

        $result = $this->top11->addContestant('Bob', 'Smith', 'bob@example.com', '555-5678', 'no', 'yes');

        $this->assertTrue($result);
    }

    public function testAddWriteInInsertsAWriteInRow(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $insertStmt = $this->createMock(PDOStatement::class);
        $insertStmt->expects($this->once())
            ->method('execute')
            ->with([':contest_id' => 1, ':write_in' => 'Some Band - Some Song', ':voter_email' => null])
            ->willReturn(true);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $insertStmt);

        $result = $this->top11->addWriteIn('Some Band - Some Song');

        $this->assertTrue($result);
    }

    public function testAddWriteInRecordsThePendingVoterEmail(): void
    {
        $contestStmt = $this->stubActiveContest(1);
        $insertStmt = $this->createMock(PDOStatement::class);
        $insertStmt->expects($this->once())
            ->method('execute')
            ->with([':contest_id' => 1, ':write_in' => 'Some Band - Some Song', ':voter_email' => 'jane@example.com'])
            ->willReturn(true);

        $this->mockDb->method('prepare')->willReturnOnConsecutiveCalls($contestStmt, $insertStmt);

        $this->top11->pendingVoterEmail = 'jane@example.com';
        $result = $this->top11->addWriteIn('Some Band - Some Song');

        $this->assertTrue($result);
    }

    public function testAddWriteInThrowsWithNoActiveContest(): void
    {
        $noContestStmt = $this->createMock(PDOStatement::class);
        $noContestStmt->method('execute')->willReturn(true);
        $noContestStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($noContestStmt);

        $this->expectExceptionMessage('No active Top 11 contest to write in for');
        $this->top11->addWriteIn('Some Band - Some Song');
    }

    /**
     * @dataProvider cpOnlyMethodProvider
     */
    public function testCpOnlyMethodsThrowInsteadOfSilentlyNoOping(callable $call): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/Payload admin Contest Controls tab/');
        $call($this->top11);
    }

    public static function cpOnlyMethodProvider(): array
    {
        return [
            'getById' => [fn (PostgresTop11 $t) => $t->getById(1)],
            'toggleStatus' => [fn (PostgresTop11 $t) => $t->toggleStatus('open')],
            'update' => [fn (PostgresTop11 $t) => $t->update(1, 'Artist', 'Song', 'Note')],
            'updateDate' => [fn (PostgresTop11 $t) => $t->updateDate('2026-01-01')],
            'updateMessage' => [fn (PostgresTop11 $t) => $t->updateMessage('Message')],
            'addSong' => [fn (PostgresTop11 $t) => $t->addSong('Artist', 'Song')],
            'updateSong' => [fn (PostgresTop11 $t) => $t->updateSong(1, 'Artist', 'Song')],
            'deleteSong' => [fn (PostgresTop11 $t) => $t->deleteSong(1)],
            'getSong' => [fn (PostgresTop11 $t) => $t->getSong(1)],
            'getAllContestants' => [fn (PostgresTop11 $t) => $t->getAllContestants()],
            'getContestantCount' => [fn (PostgresTop11 $t) => $t->getContestantCount()],
            'pickWinner' => [fn (PostgresTop11 $t) => $t->pickWinner()],
            'getNewsletterSignups' => [fn (PostgresTop11 $t) => $t->getNewsletterSignups()],
            'getAllWriteIns' => [fn (PostgresTop11 $t) => $t->getAllWriteIns()],
            'reset' => [fn (PostgresTop11 $t) => $t->reset()],
        ];
    }
}
