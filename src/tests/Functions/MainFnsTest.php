<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

// Include the file containing the functions we're testing
require_once __DIR__ . '/../../functions/main_fns.php';

/**
 * Tests for utility functions in main_fns.php
 *
 * Tests pure logic and mockable functions:
 * - format($text) - Text formatting with newlines and paragraphs
 * - on_air() - Current DJ lookup from schedule
 */
class MainFnsTest extends TestCase
{
    /**
     * Test format() with a simple text string
     */
    public function testFormatSimpleText(): void
    {
        $result = format('Hello World');
        $this->assertEquals('<p>Hello World</p>', $result);
    }

    /**
     * Test format() with empty string
     */
    public function testFormatEmptyString(): void
    {
        $result = format('');
        $this->assertEquals('<p></p>', $result);
    }

    /**
     * Test format() converts single newlines to <br/> tags
     */
    public function testFormatSingleNewlineToBr(): void
    {
        $result = format("Line 1\nLine 2");
        $this->assertEquals('<p>Line 1<br/>Line 2</p>', $result);
    }

    /**
     * Test format() converts double newlines to paragraph breaks
     */
    public function testFormatDoubleNewlineToParagraph(): void
    {
        $result = format("Paragraph 1\n\nParagraph 2");
        $this->assertEquals('<p>Paragraph 1</p><p>Paragraph 2</p>', $result);
    }

    /**
     * Test format() handles carriage returns
     */
    public function testFormatCarriageReturn(): void
    {
        $result = format("Text with\rcarriage return");
        $this->assertEquals('<p>Text withcarriage return</p>', $result);
    }

    /**
     * Test format() with mixed newline scenarios
     */
    public function testFormatMixedNewlines(): void
    {
        $result = format("First paragraph\n\nSecond paragraph\nWith a line break");
        $this->assertEquals(
            '<p>First paragraph</p><p>Second paragraph<br/>With a line break</p>',
            $result
        );
    }

    /**
     * Test format() with multiple consecutive double newlines
     */
    public function testFormatMultipleDoubleNewlines(): void
    {
        $result = format("Para 1\n\nPara 2\n\nPara 3");
        $this->assertEquals(
            '<p>Para 1</p><p>Para 2</p><p>Para 3</p>',
            $result
        );
    }

    /**
     * Test format() preserves special characters
     */
    public function testFormatSpecialCharacters(): void
    {
        $result = format('Text with <html> & "quotes" and \'apostrophes\'');
        $this->assertEquals(
            '<p>Text with <html> & "quotes" and \'apostrophes\'</p>',
            $result
        );
    }

    /**
     * Test format() with text containing only newlines
     */
    public function testFormatOnlyNewlines(): void
    {
        $result = format("\n\n\n");
        // Double newlines create paragraphs, but empty ones
        $this->assertStringContainsString('<p>', $result);
        $this->assertStringContainsString('</p>', $result);
    }

    /**
     * Test format() with realistic multi-line content
     */
    public function testFormatRealisticContent(): void
    {
        $input = "Welcome to Y-Not Radio!\n\nWe play the best alternative rock.\n"
            . "Check out our schedule for more info.";
        $expected = '<p>Welcome to Y-Not Radio!</p>'
            . '<p>We play the best alternative rock.<br/>Check out our schedule for more info.</p>';

        $result = format($input);
        $this->assertEquals($expected, $result);
    }
}
