<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\PostgresDeejay;
use PDO;
use PDOStatement;

/**
 * Tests for PostgresDeejay basic operations
 *
 * Tests PostgreSQL deejay operations using PDO:
 * - getById: Retrieve deejay by ID
 * - formatResult: Converts Lexical JSON description to HTML with preserved line breaks
 */
class PostgresDeejayTest extends TestCase
{
    private PostgresDeejay $deejay;
    private PDO $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(PDO::class);
        $this->deejay = new PostgresDeejay($this->mockDb);
    }

    /**
     * Test getById returns data when deejay exists
     */
    public function testGetByIdReturnsData(): void
    {
        $rawData = [
            'id' => 1,
            'email' => 'dj@example.com',
            'description' => 'Test DJ',
            'external_connect_text' => 'Follow me',
            'external_connect_url' => 'http://social.com',
            'sort' => 1,
            'pic' => 'http://pic.jpg',
            'name' => 'Test DJ'
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

        $result = $this->deejay->getById(1);
        
        $this->assertIsArray($result);
        $this->assertSame(1, $result['id']);
        $this->assertSame('Test DJ', $result['name']);
    }

    /**
     * Test getById returns null when deejay doesn't exist
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

        $result = $this->deejay->getById(999);
        $this->assertNull($result);
    }

    /**
     * Test that Lexical JSON description is converted to HTML, preserving line breaks
     * as paragraph tags rather than being collapsed onto a single line.
     */
    public function testLexicalDescriptionIsConvertedToHtmlWithLineBreaks(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => 'Line one of the bio.'],
                        ],
                    ],
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => 'Line two of the bio.'],
                        ],
                    ],
                ],
            ],
        ]);

        $rawData = [
            'id' => 2,
            'email' => 'hannah@example.com',
            'description' => $lexicalJson,
            'external_connect_text' => '',
            'external_connect_url' => '',
            'sort' => 2,
            'pic' => '',
            'name' => 'Hannah',
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($rawData);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->deejay->getById(2);

        $this->assertIsArray($result);
        // The 'show' field must contain HTML paragraph tags, not plain text
        $this->assertArrayHasKey('show', $result);
        $this->assertStringContainsString('<p>', $result['show']);
        $this->assertStringContainsString('Line one of the bio.', $result['show']);
        $this->assertStringContainsString('Line two of the bio.', $result['show']);
        // Must NOT be a single line of plain text (i.e. no raw \n as the only separator)
        $this->assertStringNotContainsString("Line one of the bio.\nLine two", $result['show']);
    }

    /**
     * Test that plain-text (non-JSON) description is passed through unchanged.
     */
    public function testPlainTextDescriptionIsPassedThrough(): void
    {
        $rawData = [
            'id' => 3,
            'email' => 'dj@example.com',
            'description' => 'Plain text bio without JSON.',
            'external_connect_text' => '',
            'external_connect_url' => '',
            'sort' => 3,
            'pic' => '',
            'name' => 'DJ Plain',
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($rawData);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->deejay->getById(3);

        $this->assertIsArray($result);
        $this->assertSame('Plain text bio without JSON.', $result['show']);
    }

    /**
     * Test that missing description results in an empty 'show' field.
     */
    public function testMissingDescriptionResultsInEmptyShow(): void
    {
        $rawData = [
            'id' => 4,
            'email' => 'dj@example.com',
            'external_connect_text' => '',
            'external_connect_url' => '',
            'sort' => 4,
            'pic' => '',
            'name' => 'DJ No Bio',
        ];

        $mockStmt = $this->createMock(PDOStatement::class);
        $mockStmt->method('execute')->willReturn(true);
        $mockStmt->method('fetch')->willReturn($rawData);
        $this->mockDb->method('prepare')->willReturn($mockStmt);

        $result = $this->deejay->getById(4);

        $this->assertIsArray($result);
        $this->assertSame('', $result['show']);
    }
}
