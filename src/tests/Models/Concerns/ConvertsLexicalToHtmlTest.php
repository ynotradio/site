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

    /**
     * Build a Lexical document containing a single embed block.
     */
    private function embedBlockJson(string $url, ?string $caption = null): string
    {
        $fields = ['blockType' => 'embed', 'url' => $url];
        if ($caption !== null) {
            $fields['caption'] = $caption;
        }

        return json_encode([
            'root' => [
                'children' => [
                    ['type' => 'block', 'fields' => $fields],
                ],
            ],
        ]);
    }

    public function testEmbedBlockRendersYouTubeAsResponsiveVideo(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        );

        $this->assertStringContainsString('https://www.youtube.com/embed/dQw4w9WgXcQ', $html);
        $this->assertStringContainsString('allowfullscreen', $html);
        $this->assertStringContainsString('padding-bottom:56.25%', $html);
    }

    public function testEmbedBlockConvertsPublicMixcloudUrlToWidget(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://www.mixcloud.com/ynotradio/rodney-anonymous-6526/')
        );

        $this->assertStringContainsString('player-widget.mixcloud.com/widget/iframe/', $html);
        // Feed path is rawurlencoded onto the widget src.
        $this->assertStringContainsString(
            'feed=%2Fynotradio%2Frodney-anonymous-6526%2F',
            $html
        );
    }

    public function testEmbedBlockPassesThroughMixcloudWidgetUrl(): void
    {
        $widget = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fynotradio%2Fshow%2F';
        $html = $this->converter->convert($this->embedBlockJson($widget));

        $this->assertStringContainsString('player-widget.mixcloud.com/widget/iframe/', $html);
        $this->assertStringContainsString('%2Fynotradio%2Fshow%2F', $html);
        $this->assertStringContainsString('height="120"', $html);
        $this->assertStringNotContainsString('height="60"', $html);
    }

    public function testEmbedBlockMixcloudMiniPlayerUses60pxHeight(): void
    {
        $mini = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=%2Fynotradio%2Fshow%2F';
        $html = $this->converter->convert($this->embedBlockJson($mini));

        $this->assertStringContainsString('player-widget.mixcloud.com/widget/iframe/', $html);
        $this->assertStringContainsString('mini=1', $html);
        $this->assertStringContainsString('height="60"', $html);
        $this->assertStringNotContainsString('height="120"', $html);
    }

    public function testEmbedBlockPassesThroughLegacyWwwMixcloudWidgetUrl(): void
    {
        // The format actually stored in ~180 of the 35 active custom-text pages
        // (e.g. rodney-anonymous): the widget path on the plain www.mixcloud.com
        // host, predating the player-widget.mixcloud.com host. Must be
        // recognized as already-a-widget-URL, not re-parsed as a show permalink
        // (which would read "/widget/iframe/" itself as the feed).
        $widget = 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&' .
            'feed=%2Fynotradio%2Frodney-anonymous-tells-you-how-to-live-9823%2F';
        $html = $this->converter->convert($this->embedBlockJson($widget));

        $this->assertStringContainsString(
            'feed=%2Fynotradio%2Frodney-anonymous-tells-you-how-to-live-9823%2F',
            $html
        );
        $this->assertStringNotContainsString('feed=%2Fwidget%2Fiframe%2F', $html);
        $this->assertStringContainsString('height="120"', $html);
    }

    public function testEmbedBlockRendersOpenDrivePlayer(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://www.opendrive.com/player/216190430_XqukK')
        );

        $this->assertStringContainsString('https://www.opendrive.com/player/216190430_XqukK', $html);
        $this->assertStringContainsString('height="60"', $html);
    }

    public function testEmbedBlockRendersCaption(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://youtu.be/dQw4w9WgXcQ', 'Episode 1')
        );

        $this->assertStringContainsString('class="embed-caption"', $html);
        $this->assertStringContainsString('Episode 1', $html);
    }

    public function testEmbedBlockRejectsUnsafeUrl(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('javascript:alert(1)')
        );

        $this->assertStringNotContainsString('<iframe', $html);
    }
}
