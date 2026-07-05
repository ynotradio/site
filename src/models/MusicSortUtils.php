<?php

namespace YNotRadio\Models;

/**
 * Utility functions for sorting music entries alphabetically by artist name,
 * ignoring leading articles ("The", "A", "An") per common music filing conventions.
 */
class MusicSortUtils
{
    /**
     * Return the sort key for an artist name by stripping a leading article.
     *
     * "The New Pornographers" → "New Pornographers"
     * "A Tribe Called Quest"  → "Tribe Called Quest"
     * "An Horse"              → "Horse"
     * "Arcade Fire"           → "Arcade Fire"  (unchanged)
     *
     * @param string $name Raw artist name
     * @return string Name with leading article removed, suitable for sorting
     */
    public static function stripLeadingArticle(string $name): string
    {
        return (string) preg_replace('/^(The|A|An)\s+/i', '', $name);
    }

    /**
     * Sort music entries alphabetically by artist (ignoring leading articles),
     * then by song title within the same artist.
     *
     * Each entry must have 'artist' and 'song' keys.
     *
     * @param array $entries Flat array of music entry arrays
     * @return array Sorted copy of the entries
     */
    public static function sortEntries(array $entries): array
    {
        usort($entries, static function (array $a, array $b): int {
            $artistA = strtolower(self::stripLeadingArticle($a['artist'] ?? ''));
            $artistB = strtolower(self::stripLeadingArticle($b['artist'] ?? ''));

            if ($artistA !== $artistB) {
                return strcmp($artistA, $artistB);
            }

            return strcmp(strtolower($a['song'] ?? ''), strtolower($b['song'] ?? ''));
        });

        return $entries;
    }
}
