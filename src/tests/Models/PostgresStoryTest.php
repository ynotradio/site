<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresStory;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresStory read operations.
 *
 * Covers the read path used by the front page after the Postgres cutover:
 * - getById maps a row and renders Lexical content to HTML
 * - getAll returns the [odd, even] two-column split
 * - write methods are disabled (Payload is the only write surface)
 */
class PostgresStoryTest extends TestCase
{
    private PostgresStory $story;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->story = new PostgresStory($this->mockDb);
    }

    private function lexical(string $text): string
    {
        return json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => $text],
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function testGetByIdRendersLexicalContentToHtml(): void
    {
        $row = [
            'id' => 42,
            'headline' => 'Test Story',
            'start_date' => '2026-06-01 00:00:00',
            'end_date' => '2026-12-31 00:00:00',
            'content' => $this->lexical('Hello world'),
            'priority' => 1,
            'pic' => 'http://img',
            'pic_url' => 'http://link',
            'deleted' => 'n',
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())->method('execute')->with(['id' => 42])->willReturn(true);
        $mockStmt->expects($this->once())->method('fetch')->willReturn($row);
        $this->mockDb->expects($this->once())->method('prepare')->willReturn($mockStmt);

        $result = $this->story->getById(42);

        $this->assertIsArray($result);
        $this->assertSame(42, $result['id']);
        // Lexical content is converted to the `story` HTML field.
        $this->assertArrayHasKey('story', $result);
        $this->assertArrayNotHasKey('content', $result);
        $this->assertStringContainsString('Hello world', $result['story']);
    }

    public function testGetByIdReturnsNullWhenNotFound(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $this->assertNull($this->story->getById(999));
    }

    public function testGetAllReturnsOddEvenSplit(): void
    {
        $rows = [
            ['id' => 1, 'headline' => 'A', 'content' => $this->lexical('one')],
            ['id' => 2, 'headline' => 'B', 'content' => $this->lexical('two')],
            ['id' => 3, 'headline' => 'C', 'content' => $this->lexical('three')],
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetchAll')->willReturn($rows);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        [$odd, $even] = $this->story->getAll();

        $this->assertCount(2, $odd);  // indices 0, 2
        $this->assertCount(1, $even); // index 1
        $this->assertSame(1, $odd[0]['id']);
        $this->assertSame(2, $even[0]['id']);
        $this->assertStringContainsString('one', $odd[0]['story']);
    }

    public function testWritesAreDisabled(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->story->add(['headline' => 'nope']);
    }
}
