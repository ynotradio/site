<?php

namespace YNotRadio\Models;

interface Concert {
    /**
     * Get a specific concert by ID
     * @param int $id The ID of the concert to retrieve
     * @return array|null The concert data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all concerts, optionally limited to a specific number
     * @param int $limit Optional limit on number of results
     * @return array Array of concert entries
     */
    public function getAll(int $limit = 64): array;

    /**
     * Get upcoming concerts (not deleted, date >= current date)
     * @param int $limit Optional limit on number of results (default 500)
     * @return array Array of upcoming concert entries
     */
    public function getUpcoming(int $limit = 500): array;

    /**
     * Get featured concerts
     * @param int $limit Optional limit on number of results
     * @return array Array of featured concert entries
     */
    public function getFeatured(int $limit = 5): array;

    /**
     * Add a new concert
     * @param array $data The concert data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing concert
     * @param int $id The ID of the concert to update
     * @param array $data The updated concert data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a concert (soft delete)
     * @param int $id The ID of the concert to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Get concert info as a string (artist at venue)
     * @param int $id The ID of the concert
     * @return string The concert info string
     */
    public function getConcertInfo(int $id): string;
}
