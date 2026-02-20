<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

require_once __DIR__ . '/../../functions/main_fns.php';

/**
 * Tests for the on_air() "Now playing on Y-Not Radio" feature.
 *
 * These tests guard against regressions identified in issues #208 and #209:
 *  1. On-air DJ going missing (empty string returned when a show is active).
 *  2. Incorrect DJ shown due to a date/time mismatch (gmdate vs date).
 *
 * Because on_air() requires a live database, these tests exercise the pure
 * helper find_current_slot() which contains all of the matching and formatting
 * logic extracted from on_air().
 */
class OnAirTest extends TestCase
{
    // ---------------------------------------------------------------------------
    // Basic time-slot matching
    // ---------------------------------------------------------------------------

    /**
     * Current time inside a slot returns that DJ's name.
     * Regression: on-air DJ should never be "missing" when a show is active.
     */
    public function testReturnsHostWhenCurrentTimeIsInsideSlot(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('Joey O.', $result);
    }

    /**
     * Current time before all slots returns empty string.
     */
    public function testReturnsEmptyStringWhenCurrentTimeIsBeforeAllSlots(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '09:00:00');

        $this->assertSame('', $result);
    }

    /**
     * Current time after all slots returns empty string.
     */
    public function testReturnsEmptyStringWhenCurrentTimeIsAfterAllSlots(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '13:00:00');

        $this->assertSame('', $result);
    }

    /**
     * Empty schedule always returns empty string.
     * Regression: function must handle no scheduled shows gracefully.
     */
    public function testReturnsEmptyStringForEmptySchedule(): void
    {
        $result = find_current_slot([], '11:00:00');

        $this->assertSame('', $result);
    }

    // ---------------------------------------------------------------------------
    // Boundary conditions
    // ---------------------------------------------------------------------------

    /**
     * Start time is inclusive — a show beginning at exactly the current time
     * should be returned.
     */
    public function testStartTimeIsInclusive(): void
    {
        $schedule = [
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '15:00:00');

        $this->assertSame('Joey O.', $result);
    }

    /**
     * End time is exclusive — a show ending at exactly the current time should
     * NOT be returned.
     */
    public function testEndTimeIsExclusive(): void
    {
        $schedule = [
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '21:00:00');

        $this->assertSame('', $result);
    }

    /**
     * One second before the end time is still within the slot.
     */
    public function testOneSecondBeforeEndTimeIsInsideSlot(): void
    {
        $schedule = [
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '20:59:59');

        $this->assertSame('Joey O.', $result);
    }

    // ---------------------------------------------------------------------------
    // Multiple slots
    // ---------------------------------------------------------------------------

    /**
     * Only the slot whose window contains the current time is returned.
     * Regression: a date/time mismatch (e.g. gmdate vs date) would cause the
     * wrong slot to match.
     */
    public function testCorrectSlotIsReturnedFromMultipleSlots(): void
    {
        $schedule = [
            ['start_time' => '09:00:00', 'end_time' => '12:00:00', 'host' => 'Judy G.'],
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
            ['start_time' => '21:00:00', 'end_time' => '24:00:00', 'host' => 'Third DJ'],
        ];

        $this->assertSame('Joey O.', find_current_slot($schedule, '19:26:00'));
        $this->assertSame('Judy G.', find_current_slot($schedule, '09:00:00'));
        $this->assertSame('Third DJ', find_current_slot($schedule, '21:30:00'));
    }

    /**
     * A time that falls between two consecutive slots returns empty string.
     */
    public function testTimeBetweenSlotsReturnsEmpty(): void
    {
        $schedule = [
            ['start_time' => '09:00:00', 'end_time' => '12:00:00', 'host' => 'Judy G.'],
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
        ];

        $result = find_current_slot($schedule, '13:00:00');

        $this->assertSame('', $result);
    }

    // ---------------------------------------------------------------------------
    // Display-name formatting
    // ---------------------------------------------------------------------------

    /**
     * <br> tags in the host name are replaced with a space.
     */
    public function testBrTagIsReplacedWithSpace(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'First<br>Last'],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('First Last', $result);
    }

    /**
     * <i> and </i> tags in the host name are stripped.
     */
    public function testItalicTagsAreStripped(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => '<i>DJ Name</i>'],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('DJ Name', $result);
    }

    /**
     * Host names longer than 35 characters are truncated.
     */
    public function testHostNameIsTruncatedTo35Characters(): void
    {
        $longName = 'This Is A Very Long DJ Name That Exceeds Thirty Five Characters';
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => $longName],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame(35, strlen($result));
        $this->assertSame(substr($longName, 0, 35), $result);
    }

    /**
     * Host names of exactly 35 characters are not truncated.
     */
    public function testHostNameOf35CharactersIsNotTruncated(): void
    {
        $name35 = str_repeat('A', 35);
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => $name35],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame($name35, $result);
    }

    /**
     * A host name containing mixed HTML formatting is cleaned up correctly.
     */
    public function testMixedHtmlFormattingIsCleanedUp(): void
    {
        $schedule = [
            [
                'start_time' => '18:00:00',
                'end_time'   => '21:00:00',
                'host'       => 'Judy<br><i>G.</i>',
            ],
        ];

        $result = find_current_slot($schedule, '19:00:00');

        $this->assertSame('Judy G.', $result);
    }
}
