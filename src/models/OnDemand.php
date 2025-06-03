<?php

namespace YNotRadio\Models;

interface OnDemand {
    /**
     * Get a specific on demand entry by ID
     * @param int $id The ID of the on demand entry to retrieve
     * @return array|null The on demand data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all on demand entries, filtered by page and sort order
     * @param string $sort The sort order ('date', 'artist', or 'text')
     * @param int $page The page number
     * @param int $limit Items per page
     * @return array Array of on demand entries
     */
    public function getAll(string $sort = 'date', int $page = 1, int $limit = 5): array;

    /**
     * Add a new on demand entry
     * @param array $data The on demand data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing on demand entry
     * @param int $id The ID of the on demand entry to update
     * @param array $data The updated on demand data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete an on demand entry (soft delete)
     * @param int $id The ID of the on demand entry to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Get total count of active on demand entries
     * @return int The total count
     */
    public function getTotalCount(): int;

    /**
     * Get all active on demand entries for admin view
     * @return array Array of on demand entries
     */
    public function getAllForAdmin(): array;
}
