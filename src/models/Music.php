<?php

namespace YNotRadio\Models;

interface Music {
    /**
     * Get a specific music entry by ID
     * @param int $id The ID of the music entry to retrieve
     * @return array|null The music data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all active music entries from the last 6 months
     * @return array Array of music entries
     */
    public function getAll(): array;

    /**
     * Get all music entries grouped by date
     * @return array Array of music entries grouped by date
     */
    public function getAllGroupedByDate(): array;

    /**
     * Add a new music entry
     * @param array $data The music data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing music entry
     * @param int $id The ID of the music entry to update
     * @param array $data The updated music data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a music entry (soft delete)
     * @param int $id The ID of the music entry to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;
}
