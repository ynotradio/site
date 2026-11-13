<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresYearEndPoll;
use PDO;
use PDOStatement;

class PostgresYearEndPollTest extends TestCase
{
    private PDO $db;
    private PostgresYearEndPoll $poll;

    /** @var array<int, array{sql: string, params: ?array}> */
    private array $executed = [];

    /** @var array<string, mixed> SQL substring => rows (array) or single row/false for fetch */
    private array $results = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = $this->createMock(PDO::class);
        $this->db->method('prepare')->willReturnCallback(function (string $sql) {
            return $this->statementFor($sql);
        });
        $this->poll = new PostgresYearEndPoll($this->db);

        $this->results = [
            'FROM year_end_polls' => [[
                'id' => 7,
                'name' => 'Year End Poll 2026',
                'voting_opens_at' => '2000-01-01 00:00:00+00',
                'voting_closes_at' => '2999-01-01 00:00:00+00',
                'intro_html' => '<p>Vote!</p>',
                'closed_html' => '<p>Closed</p>',
            ]],
            'FROM year_end_poll_categories_nominees' => [
                ['id' => 'n2', 'label' => 'The War On Drugs - Who\'s That', 'votes' => 0],
                ['id' => 'n1', 'label' => 'Beck - Run Away', 'votes' => 3],
            ],
            'FROM year_end_poll_categories' => [
                ['id' => 1, 'slug' => 'songs', 'display_name' => 'Songs of 2026', 'max_picks' => '2', 'required_for_contest' => true],
                ['id' => 2, 'slug' => 'movies', 'display_name' => 'Best Movies', 'max_picks' => '1', 'required_for_contest' => false],
            ],
            'FROM year_end_poll_votes' => [],
            'FROM year_end_poll_contestants' => [],
        ];
    }

    private function statementFor(string $sql): PDOStatement
    {
        $rows = [];
        foreach ($this->results as $needle => $value) {
            if (strpos($sql, $needle) !== false) {
                $rows = $value;
                break;
            }
        }

        $stmt = $this->createMock(PDOStatement::class);
        $stmt->method('execute')->willReturnCallback(function ($params = null) use ($sql) {
            $this->executed[] = ['sql' => $sql, 'params' => $params];
            return true;
        });
        $stmt->method('bindValue')->willReturnCallback(function ($key, $value) use ($sql) {
            $this->executed[] = ['sql' => $sql, 'params' => [$key => $value]];
            return true;
        });
        $stmt->method('fetchAll')->willReturn($rows);
        $stmt->method('fetch')->willReturn($rows[0] ?? false);
        return $stmt;
    }

    private function executedMatching(string $needle): array
    {
        return array_values(array_filter($this->executed, function ($e) use ($needle) {
            return strpos($e['sql'], $needle) !== false;
        }));
    }

    public function testCategoriesComeFromThePayloadPollInOrder(): void
    {
        $this->assertSame(['songs', 'movies'], $this->poll->getPollNames());
        $this->assertSame('Best Movies', $this->poll->formatPollName('movies'));
        $this->assertSame(2, $this->poll->getMaxPicks('songs'));
        $this->assertStringContainsString('<span id="max_pick">2</span> Songs of 2026', $this->poll->formatPollHeader('songs', ''));
    }

    public function testNomineesSortIgnoringLeadingThe(): void
    {
        $labels = array_column($this->poll->getPollValues('songs'), 'label');
        $this->assertSame(['Beck - Run Away', 'The War On Drugs - Who\'s That'], $labels);
        $this->assertSame(['id', 'label', 'votes'], $this->poll->getColumnNames('songs'));
    }

    public function testPollInfoExposesCopyAndWindow(): void
    {
        $info = $this->poll->getPollInfo();
        $this->assertSame('Year End Poll 2026', $info['name']);
        $this->assertSame('<p>Vote!</p>', $info['introHtml']);
        $this->assertSame('<p>Closed</p>', $info['closedHtml']);
    }

    public function testPollInfoIsNullWithoutAPoll(): void
    {
        $this->results['FROM year_end_polls'] = [];
        $this->assertNull($this->poll->getPollInfo());
        $this->assertSame([], $this->poll->getPollNames());
    }

    public function testRecordBallotWritesVotesTalliesAndWriteIn(): void
    {
        $this->db->expects($this->once())->method('beginTransaction');
        $this->db->expects($this->once())->method('commit');

        $this->assertTrue($this->poll->recordBallot('auth0|abc', 'songs', ['n1'], 'Kurt Vile - Zoom 97'));

        $votes = $this->executedMatching('INSERT INTO year_end_poll_votes');
        $this->assertCount(1, $votes);
        $this->assertSame(
            [':poll' => 7, ':category' => 1, ':nominee' => 'n1', ':voter' => 'auth0|abc'],
            $votes[0]['params']
        );
        $this->assertSame([':category' => 1, ':nominee' => 'n1'], $this->executedMatching('SET vote_count')[0]['params']);
        $this->assertSame('Kurt Vile - Zoom 97', $this->executedMatching('INSERT INTO year_end_poll_write_ins')[0]['params'][':write_in']);
    }

    public function testRecordBallotRejectsNomineeFromAnotherCategory(): void
    {
        $this->db->expects($this->never())->method('beginTransaction');
        $this->expectException(\InvalidArgumentException::class);
        $this->poll->recordBallot('auth0|abc', 'songs', ['n1', 'not-a-nominee']);
    }

    public function testRecordBallotRejectsTooManyPicks(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->poll->recordBallot('auth0|abc', 'movies', ['n1', 'n2']);
    }

    public function testRecordBallotRejectsAnonymousVoter(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->poll->recordBallot('', 'songs', ['n1']);
    }

    public function testRecordBallotRejectsWhenVotingClosed(): void
    {
        $this->results['FROM year_end_polls'][0]['voting_closes_at'] = '2001-01-01 00:00:00+00';
        $this->expectException(\RuntimeException::class);
        $this->poll->recordBallot('auth0|abc', 'songs', ['n1']);
    }

    public function testRecordBallotRollsBackWhenVoterAlreadyVoted(): void
    {
        $this->results['FROM year_end_poll_votes'] = [[1]];
        $this->db->expects($this->once())->method('rollBack');
        $this->db->expects($this->never())->method('commit');

        $this->expectException(\RuntimeException::class);
        $this->poll->recordBallot('auth0|abc', 'songs', ['n1']);
    }

    public function testCanEnterContestRequiresOnlyFlaggedCategories(): void
    {
        $this->assertFalse($this->poll->canEnterContest('auth0|abc'));

        $this->results['FROM year_end_poll_votes'] = [[1]];
        $this->executed = [];
        $this->assertTrue($this->poll->canEnterContest('auth0|abc'));
        $checked = $this->executedMatching('FROM year_end_poll_votes');
        $this->assertCount(1, $checked);
        $this->assertSame(1, $checked[0]['params'][':category']);
    }

    public function testAddContestantStoresYesNoAnswersAsBooleans(): void
    {
        $this->poll->addContestant([
            'name' => 'Pat Listener',
            'email' => ' Pat@Example.com ',
            'phone' => '555-0100',
            'hometown' => 'Philly',
            'contest' => 'yes',
            'newsletter' => 'already',
        ], 'auth0|abc');

        $bound = array_merge(...array_filter(array_column($this->executedMatching('INSERT INTO year_end_poll_contestants'), 'params')));
        $this->assertSame('pat@example.com', $bound[':email']);
        $this->assertTrue($bound[':entered']);
        $this->assertFalse($bound[':newsletter']);
        $this->assertSame('auth0|abc', $bound[':voter']);
    }

    public function testContestDuplicateChecksAreScopedToThePoll(): void
    {
        $this->assertFalse($this->poll->hasEnteredContestByEmail('Pat@Example.com'));
        $check = $this->executedMatching('FROM year_end_poll_contestants')[0];
        $this->assertStringContainsString('LOWER(email)', $check['sql']);
        $this->assertSame([':poll' => 7, ':value' => 'pat@example.com'], $check['params']);
    }

    public function testCpOnlyMethodsPointToPayload(): void
    {
        $this->expectException(\LogicException::class);
        $this->poll->getPollResults('songs');
    }
}
