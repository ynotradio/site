<?php

namespace YNotRadio\Models;

interface CdOfTheWeek {
    /**
     * Get the current CD of the week
     * @return array|null The current CD of the week data or null if none exists
     */
    public function getCurrent(): ?array;

    /**
     * Get a specific CD of the week by ID
     * @param int $id The ID of the CD of the week to retrieve
     * @return array|null The CD of the week data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all CDs of the week, optionally limited to a specific number
     * @param int $limit Optional limit on number of results
     * @return array Array of CD of the week entries
     */
    public function getAll(int $limit = 64): array;

    /**
     * Add a new CD of the week
     * @param array $data The CD of the week data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing CD of the week
     * @param int $id The ID of the CD of the week to update
     * @param array $data The updated CD of the week data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a CD of the week (soft delete)
     * @param int $id The ID of the CD of the week to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;
} 