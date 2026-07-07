<?php

namespace YNotRadio\Tests\Models\Concerns;

use PHPUnit\Framework\TestCase;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;

class ConvertsLexicalToHtmlTestHarness
{
    use ConvertsLexicalToHtml;

    private ?\PDO $db = null;

    public function __construct(?\PDO $db = null)
    {
        $this->db = $db;
    }

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

    public function testTextNodeWithSmallFontSizeStateGetsSmallClass(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            [
                                'type' => 'text',
                                'text' => 'Terms and conditions apply.',
                                '$' => ['fontSize' => 'small'],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringContainsString(
            '<span class="lexical-text--small">Terms and conditions apply.</span>',
            $html
        );
    }

    public function testTextNodeWithoutStateIsUnaffected(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => 'Normal text'],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringNotContainsString('lexical-text--small', $html);
        $this->assertStringContainsString('Normal text', $html);
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
    private function embedBlockJson(string $url, ?string $caption = null, ?bool $hideCoverImage = null): string
    {
        $fields = ['blockType' => 'embed', 'url' => $url];
        if ($caption !== null) {
            $fields['caption'] = $caption;
        }
        if ($hideCoverImage !== null) {
            $fields['hideCoverImage'] = $hideCoverImage;
        }

        return json_encode([
            'root' => [
                'children' => [
                    ['type' => 'block', 'fields' => $fields],
                ],
            ],
        ]);
    }

    /**
     * Build a Lexical document containing a single embed block with
     * arbitrary extra fields (e.g. layoutOverride/heightOverride).
     */
    private function embedBlockJsonWithFields(string $url, array $extraFields): string
    {
        $fields = array_merge(['blockType' => 'embed', 'url' => $url], $extraFields);

        return json_encode([
            'root' => [
                'children' => [
                    ['type' => 'block', 'fields' => $fields],
                ],
            ],
        ]);
    }

    /**
     * Build a Lexical document containing a single paypalButton block.
     */
    private function paypalButtonBlockJson(array $fields): string
    {
        return json_encode([
            'root' => [
                'children' => [
                    ['type' => 'block', 'fields' => array_merge(['blockType' => 'paypalButton'], $fields)],
                ],
            ],
        ]);
    }

    /**
     * Build a Lexical document containing a single paypalSmartButtons block.
     */
    private function paypalSmartButtonsBlockJson(array $fields): string
    {
        return json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'block',
                        'fields' => array_merge(['blockType' => 'paypalSmartButtons'], $fields),
                    ],
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

    public function testEmbedBlockConvertsMixcloudUrlHidingCoverByDefault(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://www.mixcloud.com/ynotradio/rodney-anonymous-6526/')
        );

        $this->assertStringContainsString('hide_cover=1', $html);
    }

    public function testEmbedBlockShowsCoverImageWhenHideCoverImageIsFalse(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson(
                'https://www.mixcloud.com/ynotradio/rodney-anonymous-6526/',
                null,
                false
            )
        );

        $this->assertStringContainsString('hide_cover=0', $html);
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

    public function testEmbedBlockRendersLive365Player(): void
    {
        $html = $this->converter->convert(
            $this->embedBlockJson('https://live365.com/embed/player.html?station=a54553&s=xl&m=light')
        );

        $this->assertStringContainsString('live365.com/embed/player.html', $html);
        $this->assertStringContainsString('class="embed embed--live365"', $html);
        $this->assertStringContainsString('height="156"', $html);
    }

    public function testEmbedBlockHeightOverrideAppliesToAudioLayout(): void
    {
        // Google Forms/Sheets fall through to the generic 'audio' layout with
        // a fixed 152px default; heightOverride lets an editor give it more room.
        $html = $this->converter->convert($this->embedBlockJsonWithFields(
            'https://docs.google.com/forms/d/e/abc/viewform',
            ['heightOverride' => 600]
        ));

        $this->assertStringContainsString('height="600"', $html);
        $this->assertStringNotContainsString('height="152"', $html);
    }

    public function testEmbedBlockLayoutOverrideForcesVideoLayout(): void
    {
        // A generic iframe URL forced into the responsive 16:9 video wrapper.
        $html = $this->converter->convert($this->embedBlockJsonWithFields(
            'https://example.com/some-video-embed',
            ['layoutOverride' => 'video']
        ));

        $this->assertStringContainsString('embed--video', $html);
        $this->assertStringContainsString('padding-bottom:56.25%', $html);
    }

    public function testEmbedBlockIgnoresHeightOverrideForVideoLayout(): void
    {
        // heightOverride only makes sense for the audio layout; a YouTube
        // video should stay purely responsive even if heightOverride is set.
        $html = $this->converter->convert($this->embedBlockJsonWithFields(
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ['heightOverride' => 999]
        ));

        $this->assertStringNotContainsString('height="999"', $html);
        $this->assertStringContainsString('padding-bottom:56.25%', $html);
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

    public function testHorizontalRuleRendersAsHr(): void
    {
        $html = $this->converter->convert(json_encode([
            'root' => ['children' => [['type' => 'horizontalrule']]],
        ]));

        $this->assertStringContainsString('<hr>', $html);
    }

    public function testQuoteNodeRendersAsBlockquote(): void
    {
        $html = $this->converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'quote',
                        'children' => [['type' => 'text', 'text' => 'To be or not to be']],
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('<blockquote>To be or not to be</blockquote>', $html);
    }

    public function testTableNodesRenderAsRealTable(): void
    {
        $html = $this->converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'table',
                        'children' => [
                            [
                                'type' => 'tablerow',
                                'children' => [
                                    [
                                        'type' => 'tablecell',
                                        'headerState' => 1,
                                        'children' => [['type' => 'text', 'text' => 'Rank']],
                                    ],
                                    [
                                        'type' => 'tablecell',
                                        'children' => [['type' => 'text', 'text' => 'Artist']],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('<table class="table table-striped">', $html);
        $this->assertStringContainsString('<tr>', $html);
        $this->assertStringContainsString('<th>Rank</th>', $html);
        $this->assertStringContainsString('<td>Artist</td>', $html);
    }

    public function testLegacyTableMarkerStillRendersAsHtmlTable(): void
    {
        // Older custom-text imports flattened tabular content into a
        // "[Table]\n..." text marker (enhancedHtmlToLexical.ts) instead of a
        // real Lexical table. Already-migrated content still needs this.
        $html = $this->converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => "[Table]\nRank | Artist\n220 | Pottery"],
                        ],
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('<table', $html);
        $this->assertStringContainsString('Pottery', $html);
        $this->assertStringNotContainsString('[Table]', $html);
    }

    public function testUploadNodeRendersImageFromMedia(): void
    {
        $db = new \PDO('sqlite::memory:');
        $db->exec('CREATE TABLE media (id INTEGER PRIMARY KEY, url TEXT, alt TEXT)');
        $db->exec("INSERT INTO media (id, url, alt) VALUES (5, 'https://cdn.example/banner.png', 'Banner')");
        $converter = new ConvertsLexicalToHtmlTestHarness($db);

        $html = $converter->convert(json_encode([
            'root' => [
                'children' => [
                    ['type' => 'upload', 'relationTo' => 'media', 'value' => 5],
                ],
            ],
        ]));

        $this->assertStringContainsString('<img', $html);
        $this->assertStringContainsString('src="https://cdn.example/banner.png"', $html);
        $this->assertStringContainsString('alt="Banner"', $html);
    }

    public function testUploadNodeAppliesAlignmentClass(): void
    {
        $db = new \PDO('sqlite::memory:');
        $db->exec('CREATE TABLE media (id INTEGER PRIMARY KEY, url TEXT, alt TEXT)');
        $db->exec("INSERT INTO media (id, url, alt) VALUES (7, 'https://cdn.example/photo.jpg', '')");
        $converter = new ConvertsLexicalToHtmlTestHarness($db);

        $html = $converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'upload',
                        'relationTo' => 'media',
                        'value' => 7,
                        'fields' => ['alignment' => 'left'],
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('lexical-image--left', $html);
    }

    public function testUploadNodeRendersLegacyWidthAndHeightAttributes(): void
    {
        // Matches top11message's <img height="100"> artist thumbnail --
        // width/height need to render as real HTML attributes so the
        // browser's native aspect-ratio sizing applies (the .lexical-image
        // CSS only forces height:auto when no height attribute is present).
        $db = new \PDO('sqlite::memory:');
        $db->exec('CREATE TABLE media (id INTEGER PRIMARY KEY, url TEXT, alt TEXT)');
        $db->exec("INSERT INTO media (id, url, alt) VALUES (9, 'https://cdn.example/thumb.jpg', '')");
        $converter = new ConvertsLexicalToHtmlTestHarness($db);

        $html = $converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'upload',
                        'relationTo' => 'media',
                        'value' => 9,
                        'height' => 100,
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('height="100"', $html);
        $this->assertStringNotContainsString('width="', $html);
    }

    public function testUploadNodeRendersNothingWhenMediaMissing(): void
    {
        $db = new \PDO('sqlite::memory:');
        $db->exec('CREATE TABLE media (id INTEGER PRIMARY KEY, url TEXT, alt TEXT)');
        $converter = new ConvertsLexicalToHtmlTestHarness($db);

        $html = $converter->convert(json_encode([
            'root' => [
                'children' => [
                    ['type' => 'upload', 'relationTo' => 'media', 'value' => 999],
                ],
            ],
        ]));

        $this->assertStringNotContainsString('<img', $html);
    }

    public function testUploadNodeSkipsDbQueryWhenNoUploadNodes(): void
    {
        // No PDO at all (test harness default) — must not attempt any query.
        $html = $this->converter->convert(json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [['type' => 'text', 'text' => 'No images here']],
                    ],
                ],
            ],
        ]));

        $this->assertStringContainsString('No images here', $html);
    }

    public function testPayPalButtonBlockRendersHostedButtonForm(): void
    {
        $html = $this->converter->convert(
            $this->paypalButtonBlockJson(['hostedButtonId' => '5EHFMBVNYRVA8'])
        );

        $this->assertStringContainsString('<form class="paypal-button"', $html);
        $this->assertStringContainsString('action="https://www.paypal.com/cgi-bin/webscr"', $html);
        $this->assertStringContainsString('value="5EHFMBVNYRVA8"', $html);
        $this->assertStringNotContainsString('<select', $html);
    }

    public function testPayPalButtonBlockRendersPriceOptionsDropdown(): void
    {
        $html = $this->converter->convert($this->paypalButtonBlockJson([
            'hostedButtonId' => '5EHFMBVNYRVA8',
            'buttonLabel' => 'Donation Options',
            'options' => [
                ['label' => 'Album Download', 'priceLabel' => '$15.00 USD'],
                ['label' => 'T-Shirt', 'priceLabel' => '$35.00 USD'],
            ],
        ]));

        $this->assertStringContainsString('<select name="os0">', $html);
        $this->assertStringContainsString('Album Download', $html);
        $this->assertStringContainsString('$35.00 USD', $html);
        $this->assertStringContainsString('name="on0" value="Donation Options Options"', $html);
    }

    public function testPayPalButtonBlockRejectsUnsafeHostedButtonId(): void
    {
        $html = $this->converter->convert(
            $this->paypalButtonBlockJson(['hostedButtonId' => '<script>alert(1)</script>'])
        );

        $this->assertStringNotContainsString('<form', $html);
        $this->assertStringNotContainsString('<script>alert', $html);
    }

    public function testPayPalButtonBlockRendersNothingWithoutHostedButtonId(): void
    {
        $html = $this->converter->convert($this->paypalButtonBlockJson([]));

        $this->assertSame('', $html);
    }

    protected function tearDown(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID');
        parent::tearDown();
    }

    public function testPayPalSmartButtonsBlockRendersSdkScriptAndButtonContainer(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID=test-client-id-123');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => 'Select how many entries you would like.',
            'items' => [
                ['label' => '1 Raffle Entry', 'price' => 1],
                ['label' => '5 Raffle Entries', 'price' => 5],
            ],
        ]));

        $this->assertStringContainsString(
            'https://www.paypal.com/sdk/js?client-id=test-client-id-123',
            $html
        );
        $this->assertStringContainsString('Select how many entries you would like.', $html);
        $this->assertStringContainsString('1 Raffle Entry', $html);
        $this->assertStringContainsString('5 Raffle Entries', $html);
        $this->assertStringContainsString('paypal-smart-buttons__button-container', $html);
        $this->assertStringNotContainsString('<select class="paypal-smart-buttons__quantity-select"', $html);
    }

    public function testPayPalSmartButtonsBlockRendersQuantitySelectWhenAllowed(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID=test-client-id-123');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => 'desc',
            'items' => [['label' => 'Item', 'price' => 2.5]],
            'allowQuantity' => true,
        ]));

        $this->assertStringContainsString('paypal-smart-buttons__quantity-select', $html);
    }

    public function testPayPalSmartButtonsBlockRendersNothingWithoutClientId(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => 'desc',
            'items' => [['label' => 'Item', 'price' => 2.5]],
        ]));

        $this->assertSame('', $html);
    }

    public function testPayPalSmartButtonsBlockRendersNothingWithoutItems(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID=test-client-id-123');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => 'desc',
            'items' => [],
        ]));

        $this->assertSame('', $html);
    }

    public function testPayPalSmartButtonsBlockRendersNothingWithoutOrderDescription(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID=test-client-id-123');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => '',
            'items' => [['label' => 'Item', 'price' => 2.5]],
        ]));

        $this->assertSame('', $html);
    }

    public function testPayPalSmartButtonsBlockDoesNotTrustClientFields(): void
    {
        putenv('PAYPAL_SMART_BUTTON_CLIENT_ID=test-client-id-123');

        $html = $this->converter->convert($this->paypalSmartButtonsBlockJson([
            'orderDescription' => 'desc',
            'items' => [['label' => 'Item', 'price' => 2.5]],
            'clientId' => 'attacker-controlled-client-id',
        ]));

        $this->assertStringContainsString('client-id=test-client-id-123', $html);
        $this->assertStringNotContainsString('attacker-controlled-client-id', $html);
    }

    public function testLegacyHtmlCommentTypedAsTextIsHidden(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => 'Keep this. '],
                            ['type' => 'text', 'text' => '<!--Stale copy from last month.-->'],
                            ['type' => 'text', 'text' => ' Keep this too.'],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringContainsString('Keep this.', $html);
        $this->assertStringContainsString('Keep this too.', $html);
        $this->assertStringNotContainsString('Stale copy from last month.', $html);
        $this->assertStringNotContainsString('&lt;!--', $html);
    }

    public function testUnterminatedLegacyHtmlCommentDoesNotSwallowFollowingContent(): void
    {
        $lexicalJson = json_encode([
            'root' => [
                'children' => [
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => '<!--No closing marker here.'],
                        ],
                    ],
                    [
                        'type' => 'paragraph',
                        'children' => [
                            ['type' => 'text', 'text' => 'Next paragraph still renders.'],
                        ],
                    ],
                ],
            ],
        ]);

        $html = $this->converter->convert($lexicalJson);

        $this->assertStringContainsString('Next paragraph still renders.', $html);
    }
}
