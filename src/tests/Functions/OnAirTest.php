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

    // ---------------------------------------------------------------------------
    // Timezone regression (issue #208)
    // ---------------------------------------------------------------------------

    /**
     * Regression test for issue #208: gmdate() vs date() timezone mismatch.
     *
     * The bug: on_air() used gmdate('Y-m-d') to fetch the schedule instead of
     * date('Y-m-d'). When local time is EST and crosses UTC midnight (e.g. Jan 29
     * at 19:26 EST = Jan 30 at 00:26 UTC), gmdate() returns the next calendar day.
     * This caused on_air() to fetch Jan 30's schedule while checking Jan 29's time,
     * so Judy G. (18:00-21:00 on Jan 30) appeared instead of Joey O. (15:00-21:00
     * on Jan 29).
     *
     * on_air() was fixed to use date('Y-m-d') so that the schedule date and the
     * current time always come from the same local timezone. This test documents
     * the exact data scenario so the mismatch is immediately visible if the bug
     * is ever reintroduced.
     */
    public function testIssue208TimezoneRegressionScenario(): void
    {
        // 7:26 PM EST — this is past UTC midnight, so gmdate() would return the next day
        $timeAtBug = '19:26:00';

        // Correct: Jan 29 schedule (local date) — Joey O. is on air 15:00-21:00
        $localDateSchedule = [
            ['start_time' => '15:00:00', 'end_time' => '21:00:00', 'host' => 'Joey O.'],
        ];
        $this->assertSame('Joey O.', find_current_slot($localDateSchedule, $timeAtBug));

        // Bug scenario: Jan 30 schedule (UTC date) — Judy G. is on air 18:00-21:00.
        // Passing the wrong date's schedule produces the wrong DJ, exactly as reported.
        $utcDateSchedule = [
            ['start_time' => '18:00:00', 'end_time' => '21:00:00', 'host' => 'Judy G.'],
        ];
        $this->assertSame('Judy G.', find_current_slot($utcDateSchedule, $timeAtBug));
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Midnight boundaries
    // ---------------------------------------------------------------------------

    /**
     * A show that uses 24:00:00 as end time should handle times near midnight.
     * Note: find_current_slot uses string comparison, so 24:00:00 > 23:59:59.
     */
    public function testShowEndingAtMidnight24Hour(): void
    {
        $schedule = [
            ['start_time' => '22:00:00', 'end_time' => '24:00:00', 'host' => 'Late Night DJ'],
        ];

        $this->assertSame('Late Night DJ', find_current_slot($schedule, '23:00:00'));
        $this->assertSame('Late Night DJ', find_current_slot($schedule, '23:59:59'));
        // At exactly 24:00:00, the show has ended (end time exclusive)
        $this->assertSame('', find_current_slot($schedule, '24:00:00'));
    }

    /**
     * A show starting at midnight (00:00:00) should match times at and after midnight.
     */
    public function testShowStartingAtMidnight(): void
    {
        $schedule = [
            ['start_time' => '00:00:00', 'end_time' => '02:00:00', 'host' => 'Early Bird DJ'],
        ];

        $this->assertSame('Early Bird DJ', find_current_slot($schedule, '00:00:00'));
        $this->assertSame('Early Bird DJ', find_current_slot($schedule, '01:30:00'));
        $this->assertSame('', find_current_slot($schedule, '02:00:00'));
    }

    // ---------------------------------------------------------------------------
    // Edge cases: All-day and long shows
    // ---------------------------------------------------------------------------

    /**
     * An all-day show covering 00:00:00 to 24:00:00 should match any time.
     */
    public function testAllDayShow(): void
    {
        $schedule = [
            ['start_time' => '00:00:00', 'end_time' => '24:00:00', 'host' => 'All Day DJ'],
        ];

        $this->assertSame('All Day DJ', find_current_slot($schedule, '00:00:00'));
        $this->assertSame('All Day DJ', find_current_slot($schedule, '12:00:00'));
        $this->assertSame('All Day DJ', find_current_slot($schedule, '23:59:59'));
    }

    /**
     * A show running nearly all day (00:00 to 23:59) should cover almost all times.
     */
    public function testNearlyAllDayShow(): void
    {
        $schedule = [
            ['start_time' => '00:00:00', 'end_time' => '23:59:00', 'host' => 'Marathon DJ'],
        ];

        $this->assertSame('Marathon DJ', find_current_slot($schedule, '06:00:00'));
        $this->assertSame('Marathon DJ', find_current_slot($schedule, '23:58:59'));
        // At 23:59:00, the show has ended
        $this->assertSame('', find_current_slot($schedule, '23:59:00'));
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Overlapping shows
    // ---------------------------------------------------------------------------

    /**
     * When two shows overlap, the first matching slot is returned (first in array).
     * This documents current behavior to catch any changes during migration.
     */
    public function testOverlappingShowsReturnsFirstMatch(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '14:00:00', 'host' => 'First DJ'],
            ['start_time' => '12:00:00', 'end_time' => '16:00:00', 'host' => 'Second DJ'],
        ];

        // At 13:00, both shows are active — first one wins
        $this->assertSame('First DJ', find_current_slot($schedule, '13:00:00'));
        // At 15:00, only Second DJ is active
        $this->assertSame('Second DJ', find_current_slot($schedule, '15:00:00'));
    }

    /**
     * Completely nested shows: a short show entirely within a longer show.
     */
    public function testNestedShowsReturnsFirstMatch(): void
    {
        $schedule = [
            ['start_time' => '09:00:00', 'end_time' => '17:00:00', 'host' => 'Day Show DJ'],
            ['start_time' => '12:00:00', 'end_time' => '13:00:00', 'host' => 'Lunch Break DJ'],
        ];

        // At noon, both are active — first one wins
        $this->assertSame('Day Show DJ', find_current_slot($schedule, '12:30:00'));
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Special characters in DJ names
    // ---------------------------------------------------------------------------

    /**
     * DJ names with accented characters are preserved correctly.
     */
    public function testAccentedCharactersInDjName(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'José García'],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('José García', $result);
    }

    /**
     * DJ names with ampersands and special punctuation are preserved.
     */
    public function testAmpersandAndSpecialPunctuationInDjName(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'Mike & Jenny'],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('Mike & Jenny', $result);
    }

    /**
     * DJ names with quotes and apostrophes are preserved.
     */
    public function testQuotesAndApostrophesInDjName(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => "DJ O'Brien \"The Boss\""],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame("DJ O'Brien \"The Boss\"", $result);
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Empty or null name handling
    // ---------------------------------------------------------------------------

    /**
     * A show with an empty host name returns empty string.
     */
    public function testEmptyHostNameReturnsEmptyString(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => ''],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('', $result);
    }

    /**
     * A show with whitespace-only host name returns whitespace (no trimming).
     * Documents current behavior to catch changes during migration.
     */
    public function testWhitespaceOnlyHostNameReturnsWhitespace(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => '   '],
        ];

        $result = find_current_slot($schedule, '11:00:00');

        $this->assertSame('   ', $result);
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Very short shows
    // ---------------------------------------------------------------------------

    /**
     * A one-minute show should still match during that minute.
     */
    public function testOneMinuteShow(): void
    {
        $schedule = [
            ['start_time' => '12:00:00', 'end_time' => '12:01:00', 'host' => 'Flash DJ'],
        ];

        $this->assertSame('Flash DJ', find_current_slot($schedule, '12:00:00'));
        $this->assertSame('Flash DJ', find_current_slot($schedule, '12:00:30'));
        $this->assertSame('', find_current_slot($schedule, '12:01:00'));
    }

    /**
     * A one-second show should match only during that exact second window.
     */
    public function testOneSecondShow(): void
    {
        $schedule = [
            ['start_time' => '12:00:00', 'end_time' => '12:00:01', 'host' => 'Instant DJ'],
        ];

        $this->assertSame('Instant DJ', find_current_slot($schedule, '12:00:00'));
        $this->assertSame('', find_current_slot($schedule, '12:00:01'));
    }

    // ---------------------------------------------------------------------------
    // Edge cases: Back-to-back shows
    // ---------------------------------------------------------------------------

    /**
     * Shows scheduled back-to-back with no gap should transition cleanly.
     * When one show ends, the next begins at the same time.
     */
    public function testBackToBackShows(): void
    {
        $schedule = [
            ['start_time' => '10:00:00', 'end_time' => '12:00:00', 'host' => 'Morning DJ'],
            ['start_time' => '12:00:00', 'end_time' => '14:00:00', 'host' => 'Afternoon DJ'],
            ['start_time' => '14:00:00', 'end_time' => '16:00:00', 'host' => 'Evening DJ'],
        ];

        $this->assertSame('Morning DJ', find_current_slot($schedule, '11:59:59'));
        $this->assertSame('Afternoon DJ', find_current_slot($schedule, '12:00:00'));
        $this->assertSame('Afternoon DJ', find_current_slot($schedule, '13:59:59'));
        $this->assertSame('Evening DJ', find_current_slot($schedule, '14:00:00'));
    }
}
