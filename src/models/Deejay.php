<?php

namespace YNotRadio\Models;

interface Deejay {
    /**
     * Get a specific deejay by ID
     * @param int $id The ID of the deejay to retrieve
     * @return array|null The deejay data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all deejays, optionally limited to a specific number
     * @param int $limit Optional limit on number of results
     * @return array Array of deejay entries
     */
    public function getAll(int $limit = 64): array;

    /**
     * Add a new deejay
     * @param array $data The deejay data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing deejay
     * @param int $id The ID of the deejay to update
     * @param array $data The updated deejay data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a deejay (soft delete)
     * @param int $id The ID of the deejay to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Get the name of a deejay by ID
     * @param int $id The ID of the deejay
     * @return string The name of the deejay
     */
    public function getName(int $id): string;

    /**
     * Update the sort order of deejays
     * @param array $items Array of deejay IDs in the desired order
     * @return bool Whether the update was successful
     */
    public function updateSortOrder(array $items): bool;
}
