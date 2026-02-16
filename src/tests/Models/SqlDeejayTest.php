<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlDeejay;

/**
 * Tests for SqlDeejay validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation with empty string checks
 */
class SqlDeejayTest extends TestCase
{
    private SqlDeejay $deejay;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->deejay = new SqlDeejay($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'name' is missing
     */
    public function testAddThrowsExceptionWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: name");
        
        $data = [
            'email' => 'test@example.com'
        ];
        
        $this->deejay->add($data);
    }

    /**
     * Test add throws exception when required field 'email' is missing
     */
    public function testAddThrowsExceptionWhenEmailMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: email");
        
        $data = [
            'name' => 'Test DJ'
        ];
        
        $this->deejay->add($data);
    }

    /**
     * Test add throws exception when both required fields are missing
     */
    public function testAddThrowsExceptionWhenBothFieldsMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: name");
        
        $data = [];
        
        $this->deejay->add($data);
    }

    /**
     * Test update throws exception when required field 'name' is missing
     */
    public function testUpdateThrowsExceptionWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: name");
        
        $data = [
            'email' => 'test@example.com'
        ];
        
        $this->deejay->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'email' is missing
     */
    public function testUpdateThrowsExceptionWhenEmailMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: email");
        
        $data = [
            'name' => 'Test DJ'
        ];
        
        $this->deejay->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'name' is empty
     */
    public function testUpdateThrowsExceptionWhenNameEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: name");
        
        $data = [
            'name' => '   ',  // Empty/whitespace only
            'email' => 'test@example.com'
        ];
        
        $this->deejay->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'email' is empty
     */
    public function testUpdateThrowsExceptionWhenEmailEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: email");
        
        $data = [
            'name' => 'Test DJ',
            'email' => ''
        ];
        
        $this->deejay->update(1, $data);
    }
}
