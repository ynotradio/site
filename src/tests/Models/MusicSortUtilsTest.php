<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\MusicSortUtils;

/**
 * Tests for MusicSortUtils
 *
 * Covers article-stripping and full sort-key behaviour for the New Music page.
 */
class MusicSortUtilsTest extends TestCase
{
    // -----------------------------------------------------------------------
    // stripLeadingArticle
    // -----------------------------------------------------------------------

    /** @dataProvider provideStripArticleCases */
    public function testStripLeadingArticle(string $input, string $expected): void
    {
        $this->assertSame($expected, MusicSortUtils::stripLeadingArticle($input));
    }

    public function provideStripArticleCases(): array
    {
        return [
            // Article stripping
            ['"The" New Pornographers sorts under N' => 'The New Pornographers', 'New Pornographers'],
            ['"The" Strokes sorts under S'           => 'The Strokes', 'Strokes'],
            ['"A" Tribe Called Quest'                => 'A Tribe Called Quest', 'Tribe Called Quest'],
            ['"An" Horse'                            => 'An Horse', 'Horse'],
            // Case-insensitive stripping
            ['the lowercase article'                 => 'the National', 'National'],
            ['THE uppercase article'                 => 'THE NATIONAL', 'NATIONAL'],
            // No article → unchanged
            ['No article'                            => 'Arcade Fire', 'Arcade Fire'],
            ['Number in name'                        => '10,000 Maniacs', '10,000 Maniacs'],
            ['Empty string'                          => '', ''],
            // "A" only matches as a standalone word, not mid-word
            ['Aphex Twin unchanged'                  => 'Aphex Twin', 'Aphex Twin'],
            ['And not stripped'                      => 'And You Will Know Us…', 'And You Will Know Us…'],
            // Article at the start followed by nothing should not strip
            ['Bare "The" unchanged'                  => 'The', 'The'],
            ['Bare "A" unchanged'                    => 'A', 'A'],
        ];
    }

    // -----------------------------------------------------------------------
    // sortEntries – artist ordering
    // -----------------------------------------------------------------------

    /**
     * "The New Pornographers" should sort under N, not T.
     */
    public function testTheArtistSortsWithoutArticle(): void
    {
        $entries = [
            ['artist' => 'The New Pornographers', 'song' => 'Song A'],
            ['artist' => 'Manic Street Preachers',  'song' => 'Song B'],
            ['artist' => 'Arcade Fire',              'song' => 'Song C'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $this->assertSame('Arcade Fire',             $sorted[0]['artist']);
        $this->assertSame('Manic Street Preachers',  $sorted[1]['artist']);
        $this->assertSame('The New Pornographers',   $sorted[2]['artist']);
    }

    /**
     * "The Strokes" should sort under S.
     */
    public function testTheStrokesSortsUnderS(): void
    {
        $entries = [
            ['artist' => 'The Strokes', 'song' => 'Reptilia'],
            ['artist' => 'REM',         'song' => 'Losing My Religion'],
            ['artist' => 'U2',          'song' => 'One'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $this->assertSame('REM',        $sorted[0]['artist']);
        $this->assertSame('The Strokes', $sorted[1]['artist']);
        $this->assertSame('U2',          $sorted[2]['artist']);
    }

    /**
     * "A Tribe Called Quest" should sort under T.
     */
    public function testArtistWithArticleASortsCorrectly(): void
    {
        $entries = [
            ['artist' => 'A Tribe Called Quest', 'song' => 'Can I Kick It?'],
            ['artist' => 'Radiohead',             'song' => 'Creep'],
            ['artist' => 'Interpol',              'song' => 'Obstacle 1'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $this->assertSame('Interpol',            $sorted[0]['artist']);
        $this->assertSame('Radiohead',           $sorted[1]['artist']);
        $this->assertSame('A Tribe Called Quest', $sorted[2]['artist']);
    }

    // -----------------------------------------------------------------------
    // sortEntries – song ordering within same artist
    // -----------------------------------------------------------------------

    /**
     * Songs by the same artist should be sorted alphabetically by title.
     */
    public function testSongsWithinSameArtistSortAlphabetically(): void
    {
        $entries = [
            ['artist' => 'The New Pornographers', 'song' => 'Challengers'],
            ['artist' => 'The New Pornographers', 'song' => 'Brill Bruisers'],
            ['artist' => 'The New Pornographers', 'song' => 'Adventures in Solitude'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $this->assertSame('Adventures in Solitude', $sorted[0]['song']);
        $this->assertSame('Brill Bruisers',         $sorted[1]['song']);
        $this->assertSame('Challengers',            $sorted[2]['song']);
    }

    // -----------------------------------------------------------------------
    // sortEntries – combined artist + song ordering
    // -----------------------------------------------------------------------

    /**
     * Full multi-artist, multi-song sort: artist sort key takes precedence,
     * then song title breaks ties within the same artist.
     */
    public function testFullSortByArtistThenSong(): void
    {
        $entries = [
            ['artist' => 'The Strokes',           'song' => 'Reptilia'],
            ['artist' => 'Arcade Fire',            'song' => 'Wake Up'],
            ['artist' => 'The New Pornographers',  'song' => 'Challengers'],
            ['artist' => 'Arcade Fire',            'song' => 'Rebellion (Lies)'],
            ['artist' => 'The New Pornographers',  'song' => 'Adventures in Solitude'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $artists = array_column($sorted, 'artist');
        $songs   = array_column($sorted, 'song');

        $this->assertSame('Arcade Fire',           $artists[0]);
        $this->assertSame('Rebellion (Lies)',       $songs[0]);

        $this->assertSame('Arcade Fire',           $artists[1]);
        $this->assertSame('Wake Up',               $songs[1]);

        $this->assertSame('The New Pornographers', $artists[2]);
        $this->assertSame('Adventures in Solitude', $songs[2]);

        $this->assertSame('The New Pornographers', $artists[3]);
        $this->assertSame('Challengers',           $songs[3]);

        $this->assertSame('The Strokes',           $artists[4]);
        $this->assertSame('Reptilia',              $songs[4]);
    }

    // -----------------------------------------------------------------------
    // sortEntries – edge cases
    // -----------------------------------------------------------------------

    /**
     * An empty entries array should be returned as-is without error.
     */
    public function testSortEntriesHandlesEmptyArray(): void
    {
        $this->assertSame([], MusicSortUtils::sortEntries([]));
    }

    /**
     * Artists starting with numbers should sort before letters.
     */
    public function testArtistStartingWithNumberSortsFirst(): void
    {
        $entries = [
            ['artist' => 'Arcade Fire',  'song' => 'Wake Up'],
            ['artist' => '10,000 Maniacs', 'song' => 'What\'s the Matter Here?'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        $this->assertSame('10,000 Maniacs', $sorted[0]['artist']);
        $this->assertSame('Arcade Fire',    $sorted[1]['artist']);
    }

    /**
     * Sorting should be case-insensitive so "arcade fire" and "Arcade Fire"
     * aren't separated by case differences.
     */
    public function testSortIsCaseInsensitive(): void
    {
        $entries = [
            ['artist' => 'zoë',          'song' => 'Song'],
            ['artist' => 'Arcade Fire',  'song' => 'Song'],
            ['artist' => 'arcade fire',  'song' => 'Song 2'],
        ];

        $sorted = MusicSortUtils::sortEntries($entries);

        // Both "Arcade Fire" variants should come before "zoë"
        $this->assertStringContainsStringIgnoringCase('arcade fire', $sorted[0]['artist']);
        $this->assertStringContainsStringIgnoringCase('arcade fire', $sorted[1]['artist']);
        $this->assertSame('zoë', $sorted[2]['artist']);
    }
}
