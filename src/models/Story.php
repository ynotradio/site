<?php

namespace YNotRadio\Models;

interface Story {
    /**
     * Get a specific story by ID
     * @param int $id The ID of the story to retrieve
     * @return array|null The story data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all active stories, optionally limited to a specific number
     * @param mixed $amount 'all' for all stories, or a number to limit
     * @return array Array of arrays, with odd and even stories separated
     */
    public function getAll($amount = 'all'): array;

    /**
     * Add a new story
     * @param array $data The story data
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing story
     * @param int $id The ID of the story to update
     * @param array $data The updated story data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a story (soft delete)
     * @param int $id The ID of the story to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Update the priority of stories
     * @param array $priorities Array of story IDs => priorities
     * @return bool Whether the update was successful
     */
    public function updatePriorities(array $priorities): bool;

    /**
     * Get all active stories for admin view
     * @return array Array of story entries
     */
    public function getAllActive(): array;
}
