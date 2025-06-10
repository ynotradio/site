<?php

// filepath: /workspaces/site/src/models/ModernRockMadnessAdmin.php

namespace YNotRadio\Models;

/**
 * Interface for Modern Rock Madness admin operations
 * 
 * This interface focuses on administrative functionality for the
 * Modern Rock Madness tournament system.
 */
interface ModernRockMadnessAdmin
{
    /**
     * Add a new band to the tournament
     * 
     * @param string $name Band name
     * @param string $url Band URL
     * @param string $pic_url Picture URL
     * @param int $placement Band placement in bracket
     * @param int $seed Band seed
     * @param string $abbr Band name abbreviation
     * @param string $sponsor Band sponsor
     * @return int|false The inserted ID on success, false on failure
     */
    public function addBand(string $name, string $url, string $pic_url, int $placement, int $seed, string $abbr, string $sponsor);
    
    /**
     * Get band information by ID
     * 
     * @param int $id Band ID
     * @return array|null Band information or null if not found
     */
    public function getBand(int $id): ?array;
    
    /**
     * Get band name by ID
     * 
     * @param int $id Band ID
     * @return string|null Band name or null if not found
     */
    public function getBandName(int $id): ?string;
    
    /**
     * Delete a band by ID
     * 
     * @param int $id Band ID
     * @return bool True on success, false on failure
     */
    public function deleteBand(int $id): bool;
    
    /**
     * Update a band's information
     * 
     * @param int $id Band ID
     * @param string $name Band name
     * @param string $url Band URL
     * @param string $pic_url Picture URL
     * @param int $placement Band placement in bracket
     * @param int $seed Band seed
     * @param string $abbr Band name abbreviation
     * @param string $sponsor Band sponsor
     * @return bool True on success, false on failure
     */
    public function updateBand(int $id, string $name, string $url, string $pic_url, int $placement, int $seed, string $abbr, string $sponsor): bool;
    
    /**
     * Get match information by ID
     * 
     * @param int $id Match ID
     * @return array|null Match information or null if not found
     */
    public function getMatch(int $id): ?array;
    
    /**
     * Update a match's sponsor information
     * 
     * @param int $matchId Match ID
     * @param string $sponsor Sponsor name
     * @param string $sponsorMsg Sponsor message
     * @return bool True on success, false on failure
     */
    public function updateSponsor(int $matchId, string $sponsor, string $sponsorMsg): bool;
    
    /**
     * Cast a vote for a band in a match
     * 
     * @param int $matchId Match ID
     * @param int $bandNumber Band number (1 or 2)
     * @param bool $bypassIpCheck Whether to bypass IP check
     * @return bool True on success, false on failure
     */
    public function vote(int $matchId, int $bandNumber, bool $bypassIpCheck = false): bool;
    
    /**
     * Close a match and set the winner
     * 
     * @param int $matchId Match ID
     * @return int|false The winner ID on success, false on failure
     */
    public function closeMatch(int $matchId);
    
    /**
     * Get the current date and time in MySQL format
     * 
     * @return string Current date and time
     */
    public function now(): string;
    
    /**
     * Get the currently active match
     * 
     * @return array|null Current match information or null if no match is active
     */
    public function getCurrentMatch(): ?array;
    
    /**
     * Calculate vote percentage for display
     * 
     * @param int $val1 First vote count
     * @param int $val2 Second vote count
     * @param string $display Display mode
     * @return string Formatted percentage
     */
    public function calculateVotePercentage(int $val1, int $val2, string $display = 'none'): string;
    
    /**
     * Get winner CSS class for a band in a match
     * 
     * @param int $bandId Band ID
     * @param int $matchId Match ID
     * @return string CSS class name
     */
    public function getWinnerClass(int $bandId, int $matchId): string;
    
    /**
     * Get the status of a match
     * 
     * @param int $matchId Match ID
     * @return string Match status: "over", "running", or "early"
     */
    public function getMatchStatus(int $matchId): string;
    
    /**
     * Check if a match is tied
     * 
     * @param array $match Match data
     * @return bool True if the match is tied
     */
    public function isMatchTied(array $match): bool;
    
    /**
     * Get all matches for a specific round
     * 
     * @param int $round Tournament round number
     * @return array Array of match data
     */
    public function getMatchesByRound(int $round): array;
    
    /**
     * Get formatted band name with seed
     * 
     * @param int $placement Band placement
     * @return string Formatted band name
     */
    public function getBandNameFormatted(int $placement): string;
    
    /**
     * Get band picture URL
     * 
     * @param int $placement Band placement
     * @return string Picture URL
     */
    public function getBandPicUrl(int $placement): string;
    
    /**
     * Get band URL
     * 
     * @param int $placement Band placement
     * @return string Band URL
     */
    public function getBandUrl(int $placement): string;
    
    /**
     * Get band abbreviation
     * 
     * @param int $placement Band placement
     * @return string Band abbreviation
     */
    public function getBandAbbr(int $placement): string;
    
    /**
     * Get band seed number
     * 
     * @param int $placement Band placement
     * @return string Band seed
     */
    public function getBandSeed(int $placement): string;
    
    /**
     * Render the admin scoreboard for a match
     * 
     * @param array $match Match information
     * @return string HTML for the admin scoreboard
     */
    public function renderAdminScoreboard(array $match): string;
    
    /**
     * Get countdown values for a match
     * 
     * @param int $matchId Match ID
     * @return array|null Countdown values (hr, min, sec) or null if error
     */
    public function getCountdownValues(int $matchId): ?array;
}
