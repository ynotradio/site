<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlCustomText;

/**
 * Tests for SqlCustomText validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation
 * - createPermalink: Pure string transformation logic
 */
class SqlCustomTextTest extends TestCase
{
    private SqlCustomText $customText;
    private $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->customText = new SqlCustomText($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'title' is missing
     */
    public function testAddThrowsExceptionWhenTitleMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [
            'html' => '<p>Test content</p>'
        ];
        
        $this->customText->add($data);
    }

    /**
     * Test add throws exception when required field 'html' is missing
     */
    public function testAddThrowsExceptionWhenHtmlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [
            'title' => 'Test Title'
        ];
        
        $this->customText->add($data);
    }

    /**
     * Test add throws exception when both required fields are missing
     */
    public function testAddThrowsExceptionWhenBothFieldsMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [];
        
        $this->customText->add($data);
    }

    /**
     * Test update throws exception when required field 'title' is missing
     */
    public function testUpdateThrowsExceptionWhenTitleMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [
            'html' => '<p>Test content</p>'
        ];
        
        $this->customText->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'html' is missing
     */
    public function testUpdateThrowsExceptionWhenHtmlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [
            'title' => 'Test Title'
        ];
        
        $this->customText->update(1, $data);
    }

    /**
     * Test update throws exception when both required fields are missing
     */
    public function testUpdateThrowsExceptionWhenBothFieldsMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Title and HTML content are required");
        
        $data = [];
        
        $this->customText->update(1, $data);
    }
}
