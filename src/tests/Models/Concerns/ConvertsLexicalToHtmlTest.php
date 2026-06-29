<?php

namespace YNotRadio\Tests\Models\Concerns;

use PHPUnit\Framework\TestCase;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;

class ConvertsLexicalToHtmlTestHarness
{
    use ConvertsLexicalToHtml;

    public function convert(?string $lexicalJson, bool $forceNewTabLinks = false): string
    {
        return $this->convertLexicalToHtml($lexicalJson, $forceNewTabLinks);
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

    public function testPreservesLeadingSpaceInTextFollowingLink(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'link',
                                'fields' => ['url' => 'https://example.com/album'],
                                'children' => [
                                    ['type' => 'text', 'text' => 'Alternative Rock'],
                                ],
                            ],
                            ['type' => 'text', 'text' => ' by The Blackburns.'],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringContainsString('</a> by The Blackburns.', $html);
    }

    public function testForceNewTabLinksOverridesLexicalNewTabFlag(): void
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
                                    'url' => 'https://www.example.com',
                                    'newTab' => false,
                                ],
                                'children' => [
                                    [
                                        'type' => 'text',
                                        'text' => 'Example',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson, true);

        $this->assertStringContainsString('target="_blank"', $html);
        $this->assertStringContainsString('rel="noopener noreferrer"', $html);
    }
}
