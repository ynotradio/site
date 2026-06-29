<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresCustomText;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresCustomText read operations.
 *
 * Covers the read path used by custom-text pages (donate, contests, rodney,
 * etc.) after the Postgres cutover:
 * - findByPermalink renders Lexical content to HTML
 * - the future-friday permalink gets its special image title + table CSS
 * - write methods are disabled (Payload is the only write surface)
 */
class PostgresCustomTextTest extends TestCase
{
    private PostgresCustomText $customText;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->customText = new PostgresCustomText($this->mockDb);
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

    private function lexicalLink(bool $newTab): string
    {
        return json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'fields' => [
                                    'url' => 'https://example.com/custom-text',
                                    'newTab' => $newTab,
                                ],
                                'children' => [
                                    ['type' => 'text', 'text' => 'Custom link'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function testFindByPermalinkRendersLexicalToHtml(): void
    {
        $row = [
            'id' => 7,
            'permalink' => 'donate',
            'title' => 'Support Us',
            'html' => $this->lexical('Please donate'),
            'legacy_id' => 641,
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with(['permalink' => 'donate'])
            ->willReturn(true);
        $mockStmt->expects($this->once())->method('fetch')->willReturn($row);
        $this->mockDb->expects($this->once())->method('prepare')->willReturn($mockStmt);

        $result = $this->customText->findByPermalink('donate');

        $this->assertIsArray($result);
        $this->assertSame('donate', $result['permalink']);
        $this->assertStringContainsString('Please donate', $result['html']);
        $this->assertStringContainsString('<p>', $result['html']);
    }

    public function testFindByPermalinkReturnsNullWhenNotFound(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn(false);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $this->assertNull($this->customText->findByPermalink('missing'));
    }

    public function testFindByPermalinkRespectsPayloadNewTabLinks(): void
    {
        $row = [
            'id' => 9,
            'permalink' => 'links-page',
            'title' => 'Links Page',
            'html' => $this->lexicalLink(true),
            'legacy_id' => 99,
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($row);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->customText->findByPermalink('links-page');

        $this->assertStringContainsString('target="_blank"', $result['html']);
        $this->assertStringContainsString('rel="noopener noreferrer"', $result['html']);
    }

    public function testFutureFridayPermalinkGetsImageTitleAndTableCss(): void
    {
        $row = [
            'id' => 8,
            'permalink' => 'future-friday',
            'title' => 'Future Friday',
            'html' => $this->lexical('schedule'),
            'legacy_id' => 18,
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($row);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->customText->findByPermalink('future-friday');

        $this->assertStringContainsString('<img src="https://i.imgur.com/1QIvI46.png"', $result['title']);
        $this->assertStringContainsString('font-size: small', $result['html']);
    }

    public function testWritesAreDisabled(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->customText->add(['title' => 'nope']);
    }
}
