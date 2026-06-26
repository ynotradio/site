<?php

namespace YNotRadio\Tests\Models\Concerns;

use PHPUnit\Framework\TestCase;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;

class ConvertsLexicalToHtmlTestHarness
{
    use ConvertsLexicalToHtml;

    public function convert(?string $lexicalJson): string
    {
        return $this->convertLexicalToHtml($lexicalJson);
    }
}

class ConvertsLexicalToHtmlTest extends TestCase
{
    private ConvertsLexicalToHtmlTestHarness $converter;

    protected function setUp(): void
    {
        $this->converter = new ConvertsLexicalToHtmlTestHarness();
    }

    public function testLinkNodeWithNewTabOpensInNewWindow(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'fields' => [
                                    'url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                    'newTab' => true,
                                ],
                                'children' => [
                                    [
                                        'type' => 'text',
                                        'text' => 'Watch video',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringContainsString('target="_blank"', $html);
        $this->assertStringContainsString('rel="noopener noreferrer"', $html);
        $this->assertStringContainsString('https://www.youtube.com/watch?v=dQw4w9WgXcQ', $html);
    }
}
