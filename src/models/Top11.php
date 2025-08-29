<?php
// filepath: /workspaces/site/src/models/Top11.php

namespace YNotRadio\Models;

/**
 * Interface for Top11 model operations
 */
interface Top11
{
    /**
     * Get a specific Top11 entry by ID
     *
     * @param int $id The ID of the Top11 entry
     * @return array|null The Top11 data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all Top11 entries
     *
     * @return array Array of Top11 entries
     */
    public function getAll(): array;

    /**
     * Get the Top11 status (open or closed)
     *
     * @return string The status
     */
    public function getStatus(): string;

    /**
     * Toggle the Top11 status between open and closed
     *
     * @param string $currentStatus The current status
     * @return bool Whether the operation was successful
     */
    public function toggleStatus(string $currentStatus): bool;

    /**
     * Update a Top11 entry
     *
     * @param int $placement The placement of the entry
     * @param string $artist The artist name
     * @param string $song The song name
     * @param string $note Any notes about the entry
     * @return bool Whether the operation was successful
     */
    public function update(int $placement, string $artist, string $song, string $note): bool;

    /**
     * Update the Top11 date
     *
     * @param string $date The date to set
     * @return bool Whether the operation was successful
     */
    public function updateDate(string $date): bool;

    /**
     * Update the Top11 message
     *
     * @param string $message The message to set
     * @return bool Whether the operation was successful
     */
    public function updateMessage(string $message): bool;

    /**
     * Get the Top11 message
     *
     * @return array The message data
     */
    public function getMessage(): array;

    /**
     * Add a Top11 song
     *
     * @param string $artist The artist name
     * @param string $song The song name
     * @return int The ID of the newly added song
     */
    public function addSong(string $artist, string $song): int;

    /**
     * Update a Top11 song
     *
     * @param int $id The ID of the song
     * @param string $artist The artist name
     * @param string $song The song name
     * @return bool Whether the operation was successful
     */
    public function updateSong(int $id, string $artist, string $song): bool;

    /**
     * Delete a Top11 song
     *
     * @param int $id The ID of the song
     * @return bool Whether the operation was successful
     */
    public function deleteSong(int $id): bool;

    /**
     * Get a Top11 song by ID
     *
     * @param int $id The ID of the song
     * @return array|null The song data or null if not found
     */
    public function getSong(int $id): ?array;

    /**
     * Get all Top11 songs
     *
     * @return array Array of Top11 songs
     */
    public function getAllSongs(): array;

    /**
     * Add a vote for a Top11 song
     *
     * @param int $id The ID of the song
     * @return bool Whether the operation was successful
     */
    public function addVote(int $id): bool;

    /**
     * Add a contestant
     *
     * @param string $firstname First name
     * @param string $lastname Last name
     * @param string $email Email address
     * @param string $phone Phone number
     * @param string $contest Whether to enter the contest
     * @param string $newsletter Whether to sign up for the newsletter
     * @return bool Whether the operation was successful
     */
    public function addContestant(string $firstname, string $lastname, string $email, string $phone, string $contest, string $newsletter): bool;

    /**
     * Get all contestants
     *
     * @return array Array of contestants
     */
    public function getAllContestants(): array;

    /**
     * Get contestant count
     *
     * @return string The count of contestants with formatting
     */
    public function getContestantCount(): string;

    /**
     * Pick a random winner from the contestants
     *
     * @return array The winner's data
     */
    public function pickWinner(): array;

    /**
     * Get newsletter subscribers who didn't enter the contest
     *
     * @return array Array of newsletter subscribers
     */
    public function getNewsletterSignups(): array;

    /**
     * Add a write-in vote
     *
     * @param string $writeIn The write-in value
     * @return bool Whether the operation was successful
     */
    public function addWriteIn(string $writeIn): bool;

    /**
     * Get all write-in votes
     *
     * @return array Array of write-in votes
     */
    public function getAllWriteIns(): array;

    /**
     * Reset all Top11 data (nuke)
     *
     * @return bool Whether the operation was successful
     */
    public function reset(): bool;

    /**
     * Check if a user has already voted this week
     *
     * @param string $userEmail The user's email address
     * @param string|null $auth0Id Optional Auth0 user ID for additional security
     * @return bool Whether the user has already voted this week
     */
    public function hasUserVotedThisWeek(string $userEmail, ?string $auth0Id = null): bool;

    /**
     * Record that a user has voted this week
     *
     * @param string $userEmail The user's email address
     * @param string|null $auth0Id Optional Auth0 user ID for additional security
     * @return bool Whether the operation was successful
     */
    public function recordUserVote(string $userEmail, ?string $auth0Id = null): bool;

    /**
     * Get the current voting week (Monday of the current week)
     *
     * @return string The Monday date of the current week (Y-m-d format)
     */
    public function getCurrentVotingWeek(): string;
}
