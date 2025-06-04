<?php

namespace YNotRadio\Models;

interface Schedule {
    /**
     * Get a specific schedule entry by ID
     * @param int $id The ID of the schedule entry to retrieve
     * @return array|null The schedule data or null if not found
     */
    public function getById(int $id): ?array;

    /**
     * Get all schedule entries for a specific date
     * @param string $date The date to get schedule for (format: YYYY-MM-DD)
     * @return array Array of schedule entries
     */
    public function getByDate(string $date): array;

    /**
     * Get all upcoming schedule entries (limited to next 7 days by default)
     * @param int $limit The number of days to include (default: 7)
     * @return array Array of schedule entries grouped by date
     */
    public function getUpcoming(int $limit = 7): array;

    /**
     * Get all upcoming schedule entries for admin view
     * @return array Array of schedule entries grouped by date
     */
    public function getAllForAdmin(): array;

    /**
     * Add a new schedule entry
     * @param array $data The schedule data (host, date, start_time, end_time, note)
     * @return int The ID of the newly created entry
     */
    public function add(array $data): int;

    /**
     * Update an existing schedule entry
     * @param int $id The ID of the schedule entry to update
     * @param array $data The updated schedule data
     * @return bool Whether the update was successful
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a schedule entry (soft delete)
     * @param int $id The ID of the schedule entry to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(int $id): bool;

    /**
     * Copy an entire day's schedule to another date
     * @param string $sourceDate The source date (format: YYYY-MM-DD)
     * @param string $targetDate The target date (format: YYYY-MM-DD)
     * @return bool Whether the copy was successful
     */
    public function copyDay(string $sourceDate, string $targetDate): bool;
}
