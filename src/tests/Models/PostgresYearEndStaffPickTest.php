<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresYearEndStaffPick;
use PDO;
use PDOStatement;

class PostgresYearEndStaffPickTest extends TestCase
{
    /** @var array<string, array> SQL substring => rows, first match wins */
    private array $results;
    private PostgresYearEndStaffPick $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->results = [
            'MAX(year)' => [['year' => '2025']],
            'year_end_staff_picks_songs' => [
                ['_parent_id' => 2, 'artist' => 'Wet Leg', 'title' => 'Catch These Fists'],
                ['_parent_id' => 1, 'artist' => 'Deep Sea Diver', 'title' => 'SHOVEL'],
            ],
            'year_end_staff_picks_albums' => [
                ['_parent_id' => 1, 'artist' => 'Wet Leg', 'title' => 'moisturizer'],
            ],
            'FROM year_end_staff_picks' => [
                [
                    'id' => 1,
                    'name' => 'Josh T. Landow',
                    'show_name' => null,
                    'details' => "Owner / Program Director\n\nHost ",
                    'mixcloud_urls' => "https://www.mixcloud.com/ynotradio/josh-t-landows-best-of-2025/\nhttps://example.com/not-mixcloud",
                ],
                ['id' => 2, 'name' => 'Hannah', 'show_name' => 'Y-Not Philly', 'details' => '', 'mixcloud_urls' => null],
            ],
        ];

        $db = $this->createMock(PDO::class);
        $db->method('prepare')->willReturnCallback(function (string $sql) {
            $rows = [];
            foreach ($this->results as $needle => $value) {
                if (strpos($sql, $needle) !== false) {
                    $rows = $value;
                    break;
                }
            }
            $stmt = $this->createMock(PDOStatement::class);
            $stmt->method('execute')->willReturn(true);
            $stmt->method('fetchAll')->willReturn($rows);
            $stmt->method('fetch')->willReturn($rows[0] ?? false);
            return $stmt;
        });
        $this->model = new PostgresYearEndStaffPick($db);
    }

    public function testReturnsLatestYearsPicksWithTheirLists(): void
    {
        $this->assertSame(2025, $this->model->getYear());
        $picks = $this->model->getAll();

        $this->assertSame(['Josh T. Landow', 'Hannah'], array_column($picks, 'name'));
        $this->assertSame([['artist' => 'Deep Sea Diver', 'title' => 'SHOVEL']], $picks[0]['songs']);
        $this->assertSame([['artist' => 'Wet Leg', 'title' => 'moisturizer']], $picks[0]['albums']);
        $this->assertSame([['artist' => 'Wet Leg', 'title' => 'Catch These Fists']], $picks[1]['songs']);
        $this->assertSame('Y-Not Philly', $picks[1]['showName']);
        $this->assertSame('', $picks[0]['showName']);
    }

    public function testSplitsDetailLinesAndBuildsMixcloudMiniPlayers(): void
    {
        $josh = $this->model->getAll()[0];
        $this->assertSame(['Owner / Program Director', 'Host'], $josh['details']);
        $this->assertSame(
            ['https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=%2Fynotradio%2Fjosh-t-landows-best-of-2025%2F'],
            $josh['players']
        );
    }

    public function testNoPicksYet(): void
    {
        $this->results['MAX(year)'] = [['year' => null]];
        $this->assertNull($this->model->getYear());
        $this->assertSame([], $this->model->getAll());
    }

    public function testEditingHappensInPayload(): void
    {
        $this->expectException(\LogicException::class);
        $this->model->add(['html' => 'x']);
    }
}
