<?php

namespace YNotRadio\Models;

interface Ad {
    /**
     * Get a specific Ad by ID
     * @param int $id The ID of the Ad to retrieve
     * @return array|null The Ad data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all active Ads, optionally limited to a specific number
     * @param int $limit Optional limit on number of results
     * @return array Array of Ad entries
     */
    public function getAll(int $limit = 64): array;

    /**
     * Add a new Ad
     * @param array $data The Ad data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing Ad
     * @param int $id The ID of the Ad to update
     * @param array $data The updated Ad data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete an Ad (soft delete)
     * @param int $id The ID of the Ad to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Get all currently running Ads (active, not deleted, within date range)
     * @return array Array of currently running Ad entries
     */
    public function getCurrent(): array;

    /**
     * Update the order/priority of an Ad
     * @param int $id The ID of the Ad
     * @param int $priority The new priority value
     * @return bool Whether the update was successful
     */
    public function updateOrder(int $id, int $priority): bool;
} 