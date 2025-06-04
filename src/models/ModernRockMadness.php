<?php

namespace YNotRadio\Models;

/**
 * Interface for Modern Rock Madness functionality
 * 
 * This interface defines the contract for Modern Rock Madness operations
 */
interface ModernRockMadness
{
    /**
     * Get a band by ID
     * 
     * @param int $id The band ID
     * @return array|null The band data or null if not found
     */
    public function getBandById(int $id): ?array;
    
    /**
     * Get a band by placement
     * 
     * @param int $placement The band placement
     * @return array|null The band data or null if not found
     */
    public function getBandByPlacement(int $placement): ?array;
    
    /**
     * Get band name by ID
     * 
     * @param int $id The band ID
     * @return string The band name
     */
    public function getBandName(int $id): string;
    
    /**
     * Get band abbreviation by placement
     * 
     * @param int $placement The band placement
     * @return string The band abbreviation
     */
    public function getBandAbbr(int $placement): string;
    
    /**
     * Get band picture URL by placement
     * 
     * @param int $placement The band placement
     * @return string The band picture URL
     */
    public function getBandPicUrl(int $placement): string;
    
    /**
     * Get band URL by placement
     * 
     * @param int $placement The band placement
     * @return string The band URL
     */
    public function getBandUrl(int $placement): string;
    
    /**
     * Get band seed by placement
     * 
     * @param int $placement The band placement
     * @return string The band seed
     */
    public function getSeed(int $placement): string;
    
    /**
     * Get sponsor name by placement
     * 
     * @param int $placement The band placement
     * @return string The sponsor name with HTML formatting
     */
    public function getSponsorName(int $placement): string;
    
    /**
     * Add a new band
     * 
     * @param array $data Band data (name, url, pic_url, placement, seed, abbr, sponsor)
     * @return int The ID of the new band
     */
    public function addBand(array $data): int;
    
    /**
     * Update an existing band
     * 
     * @param int $id The band ID
     * @param array $data Updated band data
     * @return bool True if successful
     */
    public function updateBand(int $id, array $data): bool;
    
    /**
     * Delete a band
     * 
     * @param int $id The band ID
     * @return bool True if successful
     */
    public function deleteBand(int $id): bool;
    
    /**
     * Get all bands
     * 
     * @return array All bands
     */
    public function getAllBands(): array;
    
    /**
     * Get a match by ID
     * 
     * @param int $id The match ID
     * @return array|null The match data or null if not found
     */
    public function getMatchById(int $id): ?array;
    
    /**
     * Get a match sponsor
     * 
     * @param int $id The match ID
     * @return array|null The match sponsor data or null if not found
     */
    public function getMatchSponsor(int $id): ?array;
    
    /**
     * Update a match sponsor
     * 
     * @param int $matchId The match ID
     * @param string $sponsor The sponsor name
     * @param string $sponsorMsg The sponsor message
     * @return bool True if successful
     */
    public function updateMatchSponsor(int $matchId, string $sponsor, string $sponsorMsg): bool;
    
    /**
     * Get the current match
     * 
     * @return array|null The current match or null if no match is currently running
     */
    public function getCurrentMatch(): ?array;
    
    /**
     * Get the next match
     * 
     * @return array|null The next match or null if no future matches
     */
    public function getNextMatch(): ?array;
    
    /**
     * Get matches by round
     * 
     * @param int $round The round number (1-6)
     * @return array Matches in the specified round
     */
    public function getMatchesByRound(int $round): array;
    
    /**
     * Vote for a band in a match
     * 
     * @param int $matchId The match ID
     * @param int $bandNumber The band number (1 or 2)
     * @param string $voterEmail The voter's email
     * @param bool $bypassIpCheck Whether to bypass IP check
     * @return bool True if vote was successful
     */
    public function vote(int $matchId, int $bandNumber, string $voterEmail, bool $bypassIpCheck = false): bool;
    
    /**
     * Check if a user has already voted in a match
     * 
     * @param int $matchId The match ID
     * @param string $voterEmail The voter's email
     * @return bool True if the user has already voted
     */
    public function hasVoted(int $matchId, string $voterEmail): bool;
    
    /**
     * Get the status of a match
     * 
     * @param int $matchId The match ID
     * @return string The match status ('early', 'running', 'over')
     */
    public function getMatchStatus(int $matchId): string;
    
    /**
     * Check if a match is tied
     * 
     * @param array $match The match data
     * @return bool True if the match is tied
     */
    public function isMatchTied(array $match): bool;
    
    /**
     * Close a match and set the winner
     * 
     * @param int $matchId The match ID
     * @param int $round The round number
     * @return bool True if successful
     */
    public function closeMatch(int $matchId, int $round): bool;
    
    /**
     * Enable score display for a match
     * 
     * @param int $matchId The match ID
     * @return bool True if successful
     */
    public function enableScore(int $matchId): bool;
    
    /**
     * Set the winner of a match
     * 
     * @param int $matchId The match ID
     * @return int The ID of the winner
     */
    public function setWinner(int $matchId): int;
    
    /**
     * Set up the next match after a match is completed
     * 
     * @param int $lastMatchId The completed match ID
     * @param int $winnerId The winner's ID
     * @return bool True if successful
     */
    public function setupNextMatch(int $lastMatchId, int $winnerId): bool;
    
    /**
     * Get the next match ID in the tournament flow
     * 
     * @param int $oldMatchId The completed match ID
     * @return int The next match ID
     */
    public function getNewMatch(int $oldMatchId): int;
    
    /**
     * Check if the tournament has ended
     * 
     * @return bool True if the tournament has ended
     */
    public function endOfMadness(): bool;
    
    /**
     * Check if waiting for the final match
     * 
     * @return bool True if waiting for the final match
     */
    public function waitingForFinal(): bool;
    
    /**
     * Calculate vote percentage
     * 
     * @param int $val1 The first vote count
     * @param int $val2 The second vote count
     * @param string $display Display option ('none' or 'display')
     * @return string The vote percentage formatted as a string
     */
    public function votePercentage(int $val1, int $val2, string $display = 'none'): string;
    
    /**
     * Get the tournament dates based on a start date
     * 
     * @param string $startDate Start date of the tournament in Y-m-d format
     * @return array Array of dates for each tournament round
     */
    public function getTournamentDates(string $startDate): array;
    
    /**
     * Get the tournament year from the start date
     * 
     * @param string|null $startDate The tournament start date in Y-m-d format
     * @return string The tournament year
     */
    public function getTournamentYear(?string $startDate = null): string;
}
