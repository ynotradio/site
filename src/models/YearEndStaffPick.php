<?php

namespace YNotRadio\Models;

interface YearEndStaffPick {
    /**
     * Get a specific staff pick by ID
     * @param int $id The ID of the staff pick to retrieve
     * @return array|null The staff pick data or null if not found
     */
    public function getById(int $id): ?array;
    
    /**
     * Get all staff picks
     * @return array Array of staff picks
     */
    public function getAll(): array;
    
    /**
     * Get the count of staff picks for ordering purposes
     * @return int The highest order_id 
     */
    public function getCount(): int;
    
    /**
     * Add a new staff pick
     * @param array $data The staff pick data (order_id, html)
     * @return int The ID of the newly created staff pick
     */
    public function add(array $data): int;
    
    /**
     * Update an existing staff pick
     * @param int $id The ID of the staff pick to update
     * @param array $data The updated staff pick data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;
    
    /**
     * Delete a staff pick (soft delete)
     * @param int $id The ID of the staff pick to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;
}
