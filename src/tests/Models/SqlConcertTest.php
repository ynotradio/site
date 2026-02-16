<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\Implementations\SqlConcert;

/**
 * Tests for SqlConcert validation logic
 * 
 * Tests pure validation methods that don't require database access:
 * - add: Required field validation
 * - update: Required field validation
 */
class SqlConcertTest extends TestCase
{
    private SqlConcert $concert;
    private \mysqli $mockDb;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockDb = $this->createMock(\mysqli::class);
        $this->concert = new SqlConcert($this->mockDb);
    }

    /**
     * Test add throws exception when required field 'date' is missing
     */
    public function testAddThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: date");
        
        $data = [
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->add($data);
    }

    /**
     * Test add throws exception when required field 'artist' is missing
     */
    public function testAddThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: artist");
        
        $data = [
            'date' => '2026-03-15',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->add($data);
    }

    /**
     * Test add throws exception when required field 'venue' is missing
     */
    public function testAddThrowsExceptionWhenVenueMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: venue");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->add($data);
    }

    /**
     * Test add throws exception when required field 'ticketinfo' is missing
     */
    public function testAddThrowsExceptionWhenTicketinfoMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: ticketinfo");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->add($data);
    }

    /**
     * Test add throws exception when required field 'ticketurl' is missing
     */
    public function testAddThrowsExceptionWhenTicketurlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing required field: ticketurl");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20'
        ];
        
        $this->concert->add($data);
    }

    /**
     * Test update throws exception when required field 'date' is missing
     */
    public function testUpdateThrowsExceptionWhenDateMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: date");
        
        $data = [
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'artist' is missing
     */
    public function testUpdateThrowsExceptionWhenArtistMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: artist");
        
        $data = [
            'date' => '2026-03-15',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'venue' is missing
     */
    public function testUpdateThrowsExceptionWhenVenueMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: venue");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'ticketinfo' is missing
     */
    public function testUpdateThrowsExceptionWhenTicketinfoMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: ticketinfo");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'ticketurl' is missing
     */
    public function testUpdateThrowsExceptionWhenTicketurlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: ticketurl");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'date' is empty
     */
    public function testUpdateThrowsExceptionWhenDateEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: date");
        
        $data = [
            'date' => '  ',  // Empty/whitespace only
            'artist' => 'Test Band',
            'venue' => 'Test Venue',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }

    /**
     * Test update throws exception when required field 'venue' is empty
     */
    public function testUpdateThrowsExceptionWhenVenueEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("Missing or empty required field: venue");
        
        $data = [
            'date' => '2026-03-15',
            'artist' => 'Test Band',
            'venue' => '',
            'ticketinfo' => '$20',
            'ticketurl' => 'http://tickets.com'
        ];
        
        $this->concert->update(1, $data);
    }
}
