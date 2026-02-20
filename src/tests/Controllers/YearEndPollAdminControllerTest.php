<?php

namespace YNotRadio\Tests\Controllers;

use YNotRadio\Tests\TestCase;
use YNotRadio\Controllers\YearEndPollAdminController;
use YNotRadio\Models\YearEndPoll;

/**
 * Tests for YearEndPollAdminController business logic
 * 
 * Tests admin controller orchestration:
 * - Poll name operations
 * - Format delegation
 * - Admin data retrieval
 */
class YearEndPollAdminControllerTest extends TestCase
{
    private YearEndPollAdminController $controller;
    private \mysqli $mockDb;
    private YearEndPoll $mockModel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockDb = $this->createMock(\mysqli::class);
        
        $this->controller = new YearEndPollAdminController($this->mockDb);
        
        // Get the pollModel via reflection to mock it
        $reflection = new \ReflectionClass($this->controller);
        $modelProperty = $reflection->getProperty('pollModel');
        $modelProperty->setAccessible(true);
        $this->mockModel = $this->createMock(YearEndPoll::class);
        $modelProperty->setValue($this->controller, $this->mockModel);
    }

    /**
     * Test getPollNames delegates to model
     */
    public function testGetPollNamesDelegatesToModel(): void
    {
        $pollNames = [
            'best_album',
            'best_song',
            'best_artist'
        ];
        
        $this->mockModel->expects($this->once())
            ->method('getPollNames')
            ->willReturn($pollNames);

        $result = $this->controller->getPollNames();
        $this->assertSame($pollNames, $result);
    }

    /**
     * Test getPollNames returns empty array when no polls
     */
    public function testGetPollNamesReturnsEmptyArrayWhenNoPolls(): void
    {
        $this->mockModel->method('getPollNames')
            ->willReturn([]);

        $result = $this->controller->getPollNames();
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /**
     * Test formatPollName delegates to model
     */
    public function testFormatPollNameDelegatesToModel(): void
    {
        $this->mockModel->expects($this->once())
            ->method('formatPollName')
            ->with('best_album')
            ->willReturn('Best Album');

        $result = $this->controller->formatPollName('best_album');
        $this->assertSame('Best Album', $result);
    }

    /**
     * Test formatPollName with underscores
     */
    public function testFormatPollNameWithUnderscores(): void
    {
        $this->mockModel->method('formatPollName')
            ->with('most_anticipated_album')
            ->willReturn('Most Anticipated Album');

        $result = $this->controller->formatPollName('most_anticipated_album');
        $this->assertSame('Most Anticipated Album', $result);
    }
}
