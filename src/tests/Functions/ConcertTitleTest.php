<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

require_once __DIR__ . '/../../functions/concert_title.php';

/**
 * Tests for sanitize_concert_title_html() — the allowlist sanitizer applied
 * to concert title HTML before it is echoed into a public table cell.
 */
class ConcertTitleTest extends TestCase
{
    public function testEmptyInputReturnsEmpty(): void
    {
        $this->assertSame('', sanitize_concert_title_html(null));
        $this->assertSame('', sanitize_concert_title_html(''));
    }

    public function testPlainTextPassesThrough(): void
    {
        $this->assertSame('Pete Yorn', sanitize_concert_title_html('Pete Yorn'));
    }

    public function testKeepsAllowlistedFormattingTags(): void
    {
        $input = 'Pete Yorn (<em>Musicforthemorningafter</em> 25th Anniversary)';
        $this->assertSame($input, sanitize_concert_title_html($input));
    }

    public function testKeepsBrAndStrongAndItalic(): void
    {
        $input = '<b>Loud</b> show<br><i>Subtitle</i>';
        $this->assertSame($input, sanitize_concert_title_html($input));
    }

    public function testStripsScriptTags(): void
    {
        $input = 'Pete Yorn<script>alert(1)</script>';
        $output = sanitize_concert_title_html($input);
        $this->assertStringNotContainsString('<script', $output);
        $this->assertStringContainsString('Pete Yorn', $output);
    }

    public function testStripsOnEventHandlers(): void
    {
        $input = '<a href="https://example.com" onclick="alert(1)">link</a>';
        $output = sanitize_concert_title_html($input);
        $this->assertStringNotContainsString('onclick', $output);
        $this->assertStringContainsString('href="https://example.com"', $output);
    }

    public function testNeutralizesJavascriptHref(): void
    {
        $input = '<a href="javascript:alert(1)">x</a>';
        $output = sanitize_concert_title_html($input);
        $this->assertStringNotContainsString('javascript:', $output);
        $this->assertStringContainsString('href="#"', $output);
    }

    public function testAllowsHttpsHref(): void
    {
        $input = '<a href="https://ynotradio.net">link</a>';
        $this->assertSame($input, sanitize_concert_title_html($input));
    }

    public function testStripsDisallowedTags(): void
    {
        $input = '<div><h1>Title</h1><em>ok</em></div>';
        $output = sanitize_concert_title_html($input);
        $this->assertStringNotContainsString('<div', $output);
        $this->assertStringNotContainsString('<h1', $output);
        $this->assertStringContainsString('<em>ok</em>', $output);
    }
}
