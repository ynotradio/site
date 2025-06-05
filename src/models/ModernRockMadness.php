<?php

namespace YNotRadio\Models;

/**
 * Interface for Modern Rock Madness model
 * 
 * This interface defines all methods needed for the Modern Rock Madness tournament.
 */
interface ModernRockMadness {
    /**
     * Add a new band to the Modern Rock Madness tournament
     * 
     * @param string $name The band name
     * @param string $url The band URL
     * @param string $pic_url The band picture URL
     * @param string $placement The band's placement in the bracket
     * @param string $seed The band's seed number
     * @param string $abbr The band name abbreviation
     * @param string $sponsor The band's sponsor
     * @return int The ID of the newly created band (returns 0 on failure)
     */
    public function addBand(string $name, string $url, string $pic_url, string $placement, string $seed, string $abbr, string $sponsor): int;

    /**
     * Get a band by its ID
     * 
     * @param int $id The band ID
     * @return array The band data as an array (empty array if not found)
     */
    public function getBandById(int $id): array;

    /**
     * Display a band's information as HTML
     * 
     * @param array $band The band data
     * @return string HTML representation of the band
     */
    public function displayBand(array $band): string;

    /**
     * Delete a band from the tournament
     * 
     * @param int $id The band ID to delete
     * @return bool Whether the deletion was successful
     */
    public function deleteBand(int $id): bool;

    /**
     * Get a band's name by its ID
     * 
     * @param int $id The band ID
     * @return string The band name
     */
    public function bandName(int $id): string;

    /**
     * Get a band's abbreviation by its placement
     * 
     * @param int $id The band placement
     * @return string The band abbreviation
     */
    public function getBandAbbr(int $id): string;

    /**
     * Get a sponsor name by placement
     * 
     * @param int $placement The band placement
     * @return string The sponsor name formatted as HTML
     */
    public function getSponsorName(int $placement): string;

    /**
     * Get a band name by placement
     * 
     * @param int $placement The band placement
     * @return string The band name formatted as HTML
     */
    public function getBandName(int $placement): string;

    /**
     * Get a band's picture URL by placement
     * 
     * @param int $placement The band placement
     * @return string The band picture URL
     */
    public function getBandPicUrl(int $placement): string;

    /**
     * Get a band's URL by placement
     * 
     * @param int $placement The band placement
     * @return string The band URL
     */
    public function getBandUrl(int $placement): string;

    /**
     * Get a sponsor by its ID
     * 
     * @param int $id The sponsor/match ID
     * @return array The sponsor data (empty array if not found)
     */
    public function getSponsorById(int $id): array;

    /**
     * Get a band's seed by placement
     * 
     * @param int $placement The band placement
     * @return string The seed
     */
    public function getSeed(int $placement): string;

    /**
     * Get a band's picture by ID
     * 
     * @param int $id The band ID
     * @return string The band picture URL
     */
    public function getBandPic(int $id): string;

    /**
     * Update a band's information
     * 
     * @param int $id The band ID
     * @param string $name The band name
     * @param string $url The band URL
     * @param string $pic_url The band picture URL
     * @param string $placement The band's placement
     * @param string $seed The band's seed
     * @param string $abbr The band abbreviation
     * @param string $sponsor The band's sponsor
     * @return bool Whether the update was successful
     */
    public function updateBand(int $id, string $name, string $url, string $pic_url, string $placement, string $seed, string $abbr, string $sponsor): bool;

    /**
     * Update a match's sponsor information
     * 
     * @param int $match The match ID
     * @param string $sponsor The sponsor name
     * @param string $sponsor_msg The sponsor message
     * @return bool Whether the update was successful
     */
    public function updateSponsor(int $match, string $sponsor, string $sponsor_msg): bool;

    /**
     * Calculate and format vote percentages
     * 
     * @param int $val1 First vote count
     * @param int $val2 Second vote count
     * @param string $display Display mode
     * @return string Formatted percentage
     */
    public function votePercentage(int $val1, int $val2, string $display = 'none'): string;

    /**
     * Get tournament dates based on start date
     * 
     * @param string $start_date Tournament start date
     * @return array Tournament dates
     */
    public function getTournamentDates(string $start_date): array;

    /**
     * Format a timeline item
     * 
     * @param string $title The title
     * @param string $date The date
     * @param bool $use_padding Whether to add padding
     * @return string Formatted HTML
     */
    public function formatTimelineItem(string $title, string $date, bool $use_padding = false): string;

    /**
     * Display the first row of the tournament bracket
     * 
     * @param string|null $start_date Optional start date
     * @return string HTML for the first row
     */
    public function displayFirstRow(?string $start_date = null): string;

    /**
     * Get countdown values for a match
     * 
     * @param int $match_id The match ID
     * @return array Countdown values (hours, minutes, seconds)
     */
    public function getCountdownValues(int $match_id): array;

    /**
     * Get a match by its ID
     * 
     * @param int $id The match ID
     * @return array The match data (empty array if not found)
     */
    public function getMatchById(int $id): array;

    /**
     * Get a match's status
     * 
     * @param int $match_id The match ID
     * @return string The match status ('early', 'running', 'over', 'invalid')
     */
    public function getMatchStatus(int $match_id): string;

    /**
     * Check if a match is tied
     * 
     * @param array $match The match data
     * @return bool Whether the match is tied
     */
    public function matchIsTied(array $match): bool;

    /**
     * Check if a match is closed
     * 
     * @param int $match_id The match ID
     * @return bool Whether the match is closed
     */
    public function isMatchClosed(int $match_id): bool;

    /**
     * Get the current time
     * 
     * @return string The current time in Y-m-d H:i:s format
     */
    public function getCurrentTime(): string;

    /**
     * Close a match
     * 
     * @param int $match_id The match ID
     * @param int $round The tournament round
     * @return bool Whether the match was closed successfully
     */
    public function closeMatch(int $match_id, int $round): bool;

    /**
     * Enable score display for a match
     * 
     * @param int $match_id The match ID
     * @return bool Whether the score was enabled successfully
     */
    public function enableScore(int $match_id): bool;

    /**
     * Set the winner for a match
     * 
     * @param int $match_id The match ID
     * @return int The ID of the winner
     */
    public function setWinner(int $match_id): int;

    /**
     * Setup the next match after a match is completed
     * 
     * @param int $last_match_id The ID of the last match
     * @param int $winner_id The ID of the winner
     * @return bool Whether the setup was successful
     */
    public function setupNextMatch(int $last_match_id, int $winner_id): bool;

    /**
     * Get the new match ID for a completed match
     * 
     * @param int $old_match The old match ID
     * @return int The new match ID
     */
    public function getNewMatch(int $old_match): int;

    /**
     * Get the winner class for a band in a match
     * 
     * @param int $band_id The band ID
     * @param int $match_id The match ID
     * @return string The winner class
     */
    public function getWinnerClass(int $band_id, int $match_id): string;

    /**
     * Get the SQL query for a tournament round
     * 
     * @param int $round The tournament round
     * @return string The SQL query
     */
    public function getQueryForRound(int $round): string;

    /**
     * Get all matches for a tournament round
     * 
     * @param int $round The tournament round
     * @return array The matches for the round
     */
    public function getMatchesForRound(int $round): array;

    /**
     * Get the current match
     * 
     * @return array The current match (empty array if none)
     */
    public function getCurrentMatch(): array;

    /**
     * Check if a match is the current match
     * 
     * @param array $match The match data
     * @return bool Whether the match is the current match
     */
    public function isCurrentMatch(array $match): bool;

    /**
     * Get timer or VS text for a match
     * 
     * @param array $match The match data
     * @return string The timer or VS text
     */
    public function getTimerOrVs(array $match): string;

    /**
     * Check if a match is open for voting
     * 
     * @param array $match The match data
     * @return bool Whether the match is open
     */
    public function isOpenMatch(array $match): bool;

    /**
     * Get the voting status message for a match
     * 
     * @param array $match The match data
     * @return string The voting status message
     */
    public function getVotingStatusMessage(array $match): string;

    /**
     * Check if a user has voted in a match
     * 
     * @param int $match_id The match ID
     * @return bool Whether the user has voted
     */
    public function hasVoted(int $match_id): bool;

    /**
     * Record a vote
     * 
     * @param int $match_id The match ID
     * @param int $voter_id The voter ID
     * @return bool Whether the vote was recorded successfully
     */
    public function recordVote(int $match_id, int $voter_id): bool;

    /**
     * Vote in a match
     * 
     * @param int $match_id The match ID
     * @param int $band_number The band number (1 or 2)
     * @param bool $bypass_ip_check Whether to bypass IP check
     * @param int $round The tournament round
     * @return bool Whether the vote was successful
     */
    public function vote(int $match_id, int $band_number, bool $bypass_ip_check, int $round = 1): bool;

    /**
     * Get the next match
     * 
     * @return array The next match (empty array if none)
     */
    public function getNextMatch(): array;

    /**
     * Check if waiting for the final match
     * 
     * @return bool Whether waiting for the final match
     */
    public function waitingForFinal(): bool;

    /**
     * Check if the tournament is over
     * 
     * @return bool Whether the tournament is over
     */
    public function endOfMadness(): bool;

    /**
     * Get all bands
     * 
     * @return array All bands in the tournament
     */
    public function getAllBands(): array;

    /**
     * Get the admin scoreboard HTML for a match
     * 
     * @param array $match The match data
     * @return string The admin scoreboard HTML
     */
    public function adminScoreboard(array $match): string;

    /**
     * Get the scoreboard HTML for a match
     * 
     * @param array $match The match data
     * @return string The scoreboard HTML
     */
    public function scoreboard(array $match): string;

    /**
     * Display the next match HTML
     * 
     * @param string|null $tournament_date Optional tournament date
     * @return string The next match HTML
     */
    public function nextMatchHtml(?string $tournament_date = null): string;

    /**
     * Prepare match HTML
     * 
     * @param array $match The match data
     * @param string $side The side ('left' or 'right')
     * @return string The match HTML
     */
    public function prepMatchHtml(array $match, string $side): string;

    /**
     * Display the tournament bracket
     * 
     * @return string The bracket HTML
     */
    public function displayBracket(): string;

    /**
     * Get sponsor HTML
     * 
     * @return string The sponsor HTML
     */
    public function getSponsorHtml(): string;

    /**
     * Get voting buttons HTML
     * 
     * @param array $match The match data
     * @param int $round The tournament round
     * @return string The voting buttons HTML
     */
    public function getVotingButtonsHtml(array $match, int $round): string;

    /**
     * Get close match button HTML
     * 
     * @param array $match The match data
     * @param int $round The tournament round
     * @return string The close match button HTML
     */
    public function getCloseMatchButtonHtml(array $match, int $round): string;

    /**
     * View all matches for a round
     * 
     * @param int $round The tournament round
     * @return string The matches HTML
     */
    public function viewMatches(int $round): string;

    /**
     * Show a match
     * 
     * @param int $match_id The match ID
     * @param string|null $tournament_date Optional tournament date
     * @return string The match HTML
     */
    public function showMatch(int $match_id, ?string $tournament_date = null): string;

    /**
     * Get countdown HTML
     * 
     * @param int $match_id The match ID
     * @return string The countdown HTML
     */
    public function getCountdownHtml(int $match_id): string;
}
