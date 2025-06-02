<?php

namespace YNotRadio\Models;

/**
 * Interface for Custom Text model
 */
interface CustomText
{
    /**
     * Get all custom text entries
     *
     * @return array Array of custom text entries
     */
    public function getAll(): array;
    
    /**
     * Get a specific custom text entry by ID
     *
     * @param int $id The custom text ID
     * @return array|null The custom text entry or null if not found
     */
    public function getById(int $id): ?array;
    
    /**
     * Find a custom text entry by its permalink
     *
     * @param string $permalink The permalink to search for
     * @return array|null The custom text entry or null if not found
     */
    public function findByPermalink(string $permalink): ?array;
    
    /**
     * Add a new custom text entry
     *
     * @param array $data The custom text data (title, html)
     * @return int The ID of the newly created custom text
     */
    public function add(array $data): int;
    
    /**
     * Update an existing custom text entry
     *
     * @param int $id The ID of the custom text to update
     * @param array $data The updated custom text data
     * @return bool True if successful, false otherwise
     */
    public function update(int $id, array $data): bool;
    
    /**
     * Delete a custom text entry
     *
     * @param int $id The ID of the custom text to delete
     * @return bool True if successful, false otherwise
     */
    public function delete(int $id): bool;
    
    /**
     * Check if a permalink is valid (not already in use)
     *
     * @param string $permalink The permalink to check
     * @return bool True if valid (not in use), false otherwise
     */
    public function isValidPermalink(string $permalink): bool;
    
    /**
     * Create a permalink from a title
     *
     * @param string $title The title to convert to a permalink
     * @return string The created permalink
     */
    public function createPermalink(string $title): string;
}
