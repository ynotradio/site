<?php

// filepath: /workspaces/site/src/models/ModernRockMadness.php

namespace YNotRadio\Models;

/**
 * Interface for Modern Rock Madness model operations
 * 
 * This interface focuses on public voter-facing functionality for the
 * Modern Rock Madness tournament system.
 */
interface ModernRockMadness
{
    /**
     * Get the current match that is running or should be displayed
     *
     * @return array|null The current match data or null if no current match
     */
    public function getCurrentMatch(): ?array;

    /**
     * Get a specific match by ID
     *
     * @param int $matchId The match ID
     * @return array|null The match data or null if not found
     */
    public function getMatch(int $matchId): ?array;

    /**
     * Get the next upcoming match
     *
     * @return array|null The next match data or null if no upcoming matches
     */
    public function getNextMatch(): ?array;

    /**
     * Get band information by placement ID
     *
     * @param int $placement The band's placement ID (1-64)
     * @return array|null The band data or null if not found
     */
    public function getBandByPlacement(int $placement): ?array;

    /**
     * Get the status of a specific match
     *
     * @param int $matchId The match ID
     * @return string The match status: 'early', 'running', or 'over'
     */
    public function getMatchStatus(int $matchId): string;

    /**
     * Check if the tournament has ended
     *
     * @return bool True if tournament is over, false otherwise
     */
    public function isTournamentOver(): bool;

    /**
     * Check if we're waiting for the final match results
     *
     * @return bool True if waiting for final, false otherwise
     */
    public function isWaitingForFinal(): bool;

    /**
     * Get the tournament champion
     *
     * @return array|null The champion band data or null if no champion yet
     */
    public function getChampion(): ?array;

    /**
     * Get the tournament year from the start date
     *
     * @param string|null $startDate Optional start date, uses current year if null
     * @return string The tournament year
     */
    public function getTournamentYear(?string $startDate = null): string;

    /**
     * Check if a user has voted in a specific match
     *
     * @param int $matchId The match ID
     * @param string $voterEmail The voter's email address
     * @return bool True if user has voted, false otherwise
     */
    public function hasVoted(int $matchId, string $voterEmail): bool;

    /**
     * Record a vote for a match
     *
     * @param int $matchId The match ID
     * @param int $bandNumber The band number (1 or 2)
     * @param string $voterEmail The voter's email address
     * @param string $voterIp The voter's IP address
     * @return bool True if vote was recorded successfully
     * @throws \Exception If vote cannot be recorded
     */
    public function recordVote(int $matchId, int $bandNumber, string $voterEmail, string $voterIp): bool;

    /**
     * Calculate vote percentage for display
     *
     * @param int $votes1 Votes for option 1
     * @param int $votes2 Votes for option 2
     * @param string $display Display mode: 'none' or 'display'
     * @return string The percentage string
     */
    public function calculateVotePercentage(int $votes1, int $votes2, string $display = 'none'): string;

    /**
     * Get all matches for the bracket display
     *
     * @return array Array of matches organized by region
     */
    public function getBracketMatches(): array;

    /**
     * Get timeline data for the tournament
     *
     * @param string $startDate Tournament start date
     * @return array Timeline data with dates for each round
     */
    public function getTimelineData(string $startDate): array;
}
