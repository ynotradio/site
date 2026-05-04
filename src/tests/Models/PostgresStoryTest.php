<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresStory;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresStory basic operations
 * 
 * Tests PostgreSQL story operations using PDO:
 * - getById: Retrieve story by ID
 * - getAll: Retrieve active stories filtered by show_on_front_page
 * - getAllActive: Retrieve all active stories filtered by show_on_front_page
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

    /**
     * Test getById returns data when story exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'headline' => 'Test Story',
            'start_date' => '2026-02-01 00:00:00',
            'end_date' => '2026-02-28 23:59:59',
            'content' => 'Test content',
            'priority' => 1,
            'pic' => 'http://pic.jpg',
            'pic_url' => '',
            'deleted' => 'n'
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->with(['id' => 1])
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn($rawData);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->story->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test Story', $result['headline']);
    }

    /**
     * Test getById returns null when story doesn't exist
     */
    public function testGetByIdReturnsNullWhenNotFound(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        
        $mockStmt->expects($this->once())
            ->method('fetch')
            ->willReturn(false);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->willReturn($mockStmt);

        $result = $this->story->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test getAll query includes show_on_front_page filter
     */
    public function testGetAllFiltersByShowOnFrontPage(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('fetchAll')
            ->willReturn([]);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->with($this->callback(function (string $query) {
                return str_contains($query, 'show_on_front_page = true');
            }))
            ->willReturn($mockStmt);

        $result = $this->story->getAll();
        $this->assertIsArray($result);
        $this->assertCount(2, $result); // Returns [odd, even] arrays
    }

    /**
     * Test getAllActive query includes show_on_front_page filter
     */
    public function testGetAllActiveFiltersByShowOnFrontPage(): void
    {
        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->expects($this->once())
            ->method('execute')
            ->willReturn(true);
        $mockStmt->expects($this->once())
            ->method('fetchAll')
            ->willReturn([]);

        $this->mockDb->expects($this->once())
            ->method('prepare')
            ->with($this->callback(function (string $query) {
                return str_contains($query, 'show_on_front_page = true');
            }))
            ->willReturn($mockStmt);

        $result = $this->story->getAllActive();
        $this->assertIsArray($result);
    }

    // ─── Lexical → HTML conversion tests ─────────────────────────────────

    /**
     * Helper: invoke private convertLexicalToHtml via reflection
     */
    private function callConvertLexicalToHtml(string $json): string
    {
        $method = new \ReflectionMethod(PostgresStory::class, 'convertLexicalToHtml');
        $method->setAccessible(true);
        return $method->invoke($this->story, $json);
    }

    /**
     * Helper: invoke private isValidUrl via reflection
     */
    private function callIsValidUrl(string $url): bool
    {
        $method = new \ReflectionMethod(PostgresStory::class, 'isValidUrl');
        $method->setAccessible(true);
        return $method->invoke($this->story, $url);
    }

    /**
     * Test link nodes read URL from fields.url (Payload Lexical format)
     */
    public function testLinkNodeReadsUrlFromFieldsUrl(): void
    {
        $lexical = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'fields' => [
                                    'url' => 'https://example.com/vote',
                                    'linkType' => 'custom',
                                    'newTab' => false,
                                ],
                                'children' => [
                                    ['type' => 'text', 'text' => 'VOTE HERE'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        $this->assertStringContainsString(
            'href="https://example.com/vote"',
            $html
        );
        $this->assertStringContainsString('VOTE HERE', $html);
    }

    /**
     * Test link nodes fall back to node.url when fields.url is absent
     */
    public function testLinkNodeFallsBackToNodeUrl(): void
    {
        $lexical = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'url' => 'https://fallback.example.com',
                                'children' => [
                                    ['type' => 'text', 'text' => 'Click'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        $this->assertStringContainsString(
            'href="https://fallback.example.com"',
            $html
        );
    }

    /**
     * Test link nodes with empty URL get href="#"
     */
    public function testLinkNodeWithEmptyUrlGetsFallbackHash(): void
    {
        $lexical = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'children' => [
                                    ['type' => 'text', 'text' => 'Broken'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        // Empty string is not a valid URL, so isValidUrl returns false → '#'
        $this->assertStringContainsString('href="#"', $html);
    }

    /**
     * Test link nodes with missing fields key also fall back
     */
    public function testLinkNodeWithNoFieldsKeyFallsBack(): void
    {
        $lexical = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'url' => 'https://direct-url.com',
                                'children' => [
                                    ['type' => 'text', 'text' => 'Direct'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        $this->assertStringContainsString(
            'href="https://direct-url.com"',
            $html
        );
    }

    /**
     * Test link URL special characters are HTML-escaped
     */
    public function testLinkUrlIsHtmlEscaped(): void
    {
        $lexical = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'fields' => [
                                    'url' => 'https://example.com/page?a=1&b=2',
                                ],
                                'children' => [
                                    ['type' => 'text', 'text' => 'Link'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        $this->assertStringContainsString(
            'href="https://example.com/page?a=1&amp;b=2"',
            $html
        );
    }

    /**
     * Empty paragraph nodes (Enter on a blank line in the editor) should
     * render as <p><br></p> so they produce a visible blank line. Browsers
     * collapse plain <p></p> to zero height, which surprises content editors.
     */
    public function testEmptyParagraphRendersAsParagraphWithBr(): void
    {
        $lexical = json_encode([
            'root' => [
                'type' => 'root',
                'children' => [
                    ['type' => 'paragraph', 'children' => [['type' => 'text', 'text' => 'before']]],
                    ['type' => 'paragraph', 'children' => []],
                    ['type' => 'paragraph', 'children' => [['type' => 'text', 'text' => 'after']]],
                ],
            ],
        ]);

        $html = $this->callConvertLexicalToHtml($lexical);

        $this->assertStringContainsString('<p><br></p>', $html);
        $this->assertStringNotContainsString('<p></p>', $html);
    }

    // ─── isValidUrl tests ────────────────────────────────────────────────

    /**
     * @dataProvider validUrlProvider
     */
    public function testIsValidUrlAcceptsValidUrls(string $url): void
    {
        $this->assertTrue($this->callIsValidUrl($url));
    }

    public static function validUrlProvider(): array
    {
        return [
            'https'        => ['https://example.com'],
            'http'         => ['http://example.com'],
            'relative'     => ['/some/path'],
            'anchor'       => ['#section'],
            'path only'    => ['top11.php'],
            'complex URL'  => ['https://www.example.com/path?q=1&r=2#frag'],
        ];
    }

    /**
     * @dataProvider invalidUrlProvider
     */
    public function testIsValidUrlRejectsInvalidUrls(string $url): void
    {
        $this->assertFalse($this->callIsValidUrl($url));
    }

    public static function invalidUrlProvider(): array
    {
        return [
            'empty string'       => [''],
            'javascript scheme'  => ['javascript:alert(1)'],
            'data scheme'        => ['data:text/html,<h1>xss</h1>'],
        ];
    }
}
