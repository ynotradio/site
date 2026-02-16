<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

require_once(__DIR__ . '/../../functions/main_fns.php');

/**
 * Tests for main_fns.php utility functions (additional coverage)
 * 
 * Extends existing MainFnsTest with additional format() test cases:
 * - Edge cases and special characters
 * - Empty and whitespace handling
 * - Complex formatting scenarios
 */
class MainFnsExtendedTest extends TestCase
{
    /**
     * Test format() with carriage returns only
     */
    public function testFormatWithCarriageReturns(): void
    {
        $input = "Line one\rLine two\rLine three";
        $result = format($input);
        
        // Carriage returns should be removed
        $this->assertStringNotContainsString("\r", $result);
        $this->assertStringContainsString('<p>', $result);
        $this->assertStringContainsString('</p>', $result);
    }

    /**
     * Test format() with double newlines
     */
    public function testFormatWithDoubleNewlines(): void
    {
        $input = "Paragraph one\n\nParagraph two\n\nParagraph three";
        $result = format($input);
        
        // Double newlines should create separate paragraphs
        $this->assertStringContainsString('</p><p>', $result);
    }

    /**
     * Test format() with single newlines
     */
    public function testFormatWithSingleNewlines(): void
    {
        $input = "Line one\nLine two\nLine three";
        $result = format($input);
        
        // Single newlines should become <br/>
        $this->assertStringContainsString('<br/>', $result);
    }

    /**
     * Test format() with mixed line endings
     */
    public function testFormatWithMixedLineEndings(): void
    {
        $input = "Paragraph one\n\nLine two\nLine three";
        $result = format($input);
        
        // Should handle both paragraph breaks and line breaks
        $this->assertStringContainsString('</p><p>', $result);
        $this->assertStringContainsString('<br/>', $result);
    }

    /**
     * Test format() with empty string
     */
    public function testFormatWithEmptyString(): void
    {
        $input = "";
        $result = format($input);
        
        // Should wrap in paragraph tags
        $this->assertSame('<p></p>', $result);
    }

    /**
     * Test format() with only whitespace
     */
    public function testFormatWithOnlyWhitespace(): void
    {
        $input = "   ";
        $result = format($input);
        
        // Should wrap whitespace in paragraph tags
        $this->assertStringStartsWith('<p>', $result);
        $this->assertStringEndsWith('</p>', $result);
    }

    /**
     * Test format() preserves text content
     */
    public function testFormatPreservesTextContent(): void
    {
        $input = "Important content here";
        $result = format($input);
        
        // Should preserve the actual text
        $this->assertStringContainsString('Important content here', $result);
    }

    /**
     * Test format() with special characters
     */
    public function testFormatWithSpecialCharacters(): void
    {
        $input = "Text with <special> & characters";
        $result = format($input);
        
        // Should preserve special characters (format doesn't escape HTML)
        $this->assertStringContainsString('<special>', $result);
        $this->assertStringContainsString('&', $result);
    }
}
