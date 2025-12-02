<?php

// filepath: /workspaces/site/src/models/YearEndPoll.php

namespace YNotRadio\Models;

/**
 * Interface for Year End Poll model operations
 * 
 * This interface defines all functionality for the Year End Poll system,
 * including both voter-facing and admin operations.
 */
interface YearEndPoll
{
    /**
     * Get all available poll categories/names
     *
     * @return array List of all poll names/categories
     */
    public function getPollNames(): array;

    /**
     * Get the values (options) for a specific poll
     *
     * @param string $pollName The name of the poll (e.g., 'songs', 'albums', etc.)
     * @return array The poll options with their data
     */
    public function getPollValues(string $pollName): array;

    /**
     * Check if a user has voted in a specific poll
     *
     * @param string $ip The voter's IP address
     * @param string $pollName The name of the poll to check
     * @return bool True if user has voted, false otherwise
     */
    public function hasVoted(string $ip, string $pollName): bool;

    /**
     * Add votes for a specific poll
     *
     * @param string $pollName The name of the poll
     * @param array $votes Array of option IDs that were voted for
     * @return bool True if votes were added successfully
     * @throws \Exception If votes cannot be recorded
     */
    public function addVotes(string $pollName, array $votes): bool;

    /**
     * Add a manual write-in vote
     *
     * @param string $ip The voter's IP address
     * @param string $pollName The name of the poll
     * @param string $writeInValue The manual write-in value
     * @return bool True if write-in was added successfully
     * @throws \Exception If write-in cannot be recorded
     */
    public function addWriteInVote(string $ip, string $pollName, string $writeInValue): bool;

    /**
     * Add a voter's IP to the record for a specific poll
     *
     * @param string $ip The voter's IP address
     * @param string $pollName The name of the poll
     * @return bool True if IP was recorded successfully
     * @throws \Exception If IP cannot be recorded
     */
    public function recordVoterIp(string $ip, string $pollName): bool;

    /**
     * Add specific votes for songs poll (which has a special structure)
     *
     * @param string $ip The voter's IP address
     * @param array $votes Array of song IDs that were voted for
     * @param string $writeInValue Optional write-in value
     * @return bool True if song votes were added successfully
     * @throws \Exception If song votes cannot be recorded
     */
    public function addSongVotes(string $ip, array $votes, string $writeInValue = ''): bool;

    /**
     * Format the header for a poll
     *
     * @param string $pollName The name of the poll
     * @param string $category The category title
     * @return string Formatted poll header
     */
    public function formatPollHeader(string $pollName, string $category): string;

    /**
     * Format a poll name for display
     *
     * @param string $pollName The name of the poll
     * @return string Formatted poll name for display
     */
    public function formatPollName(string $pollName): string;

    /**
     * Get the maximum number of picks allowed for a poll
     *
     * @param string $pollName The name of the poll
     * @return int Maximum number of picks allowed
     */
    public function getMaxPicks(string $pollName): int;

    /**
     * Get column names for a poll table
     *
     * @param string $pollName The name of the poll
     * @return array Column names for the poll table
     */
    public function getColumnNames(string $pollName): array;

    /**
     * Check if a user can enter the contest
     * 
     * @param string $ip The voter's IP address
     * @return bool True if the user can enter the contest
     */
    public function canEnterContest(string $ip): bool;

    /**
     * Check if a user has already entered the contest by IP address
     *
     * @param string $ip The voter's IP address
     * @return bool True if user has already entered
     */
    public function hasEnteredContest(string $ip): bool;

    /**
     * Check if an email address has already been used to enter the contest
     *
     * @param string $email The email address to check (case insensitive)
     * @return bool True if email has already been used
     */
    public function hasEnteredContestByEmail(string $email): bool;

    /**
     * Check if a phone number has already been used to enter the contest
     *
     * @param string $phone The phone number to check
     * @return bool True if phone number has already been used
     */
    public function hasEnteredContestByPhone(string $phone): bool;

    /**
     * Add a contestant to the contest
     * 
     * @param array $contestantData Contestant data (name, email, phone, etc.)
     * @param string $ip The contestant's IP address
     * @return bool True if contestant was added successfully
     * @throws \Exception If contestant cannot be added
     */
    public function addContestant(array $contestantData, string $ip): bool;
    
    /**
     * Get all contestants entries
     * 
     * @return array List of all contestants
     */
    public function getAllContestEntries(): array;
    
    /**
     * Get contestant by ID
     * 
     * @param int $contestantId The contestant ID
     * @return array|null Contestant data or null if not found
     */
    public function getContestantById(int $contestantId): ?array;
    
    /**
     * Get song votes for a contestant
     * 
     * @param string $ipAddress The contestant's IP address
     * @return array|null Song votes data or null if not found
     */
    public function getContestantSongVotes(string $ipAddress): ?array;
    
    /**
     * Get poll results ordered by votes
     * 
     * @param string $pollName The name of the poll
     * @return array Results with vote counts
     */
    public function getPollResults(string $pollName): array;
    
    /**
     * Get all write-ins for a poll
     * 
     * @param string $pollName The name of the poll
     * @return array All write-in entries
     */
    public function getWriteInsForPoll(string $pollName): array;
}
