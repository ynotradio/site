<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Music;
use YNotRadio\Models\MusicSortUtils;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Music model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresMusic implements Music {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get a specific music entry by ID
     * 
     * @param int $id The ID of the music entry to retrieve
     * @return array|null The music data or null if not found
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.release_date::date as date,
                COALESCE(a.name, '') as artist,
                s.title as song,
                COALESCE(s.stream_url, '') as url,
                'n' as deleted
            FROM songs s
            LEFT JOIN artists a ON s.artist_id = a.id
            WHERE s.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get all active music entries from the last 6 months
     * 
     * @return array Array of music entries
     */
    public function getAll(): array {
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.release_date::date as date,
                COALESCE(a.name, '') as artist,
                s.title as song,
                COALESCE(s.stream_url, '') as url,
                'n' as deleted
            FROM songs s
            LEFT JOIN artists a ON s.artist_id = a.id
            WHERE s.feature_on_new_music = true
                AND s.release_date::date > CURRENT_DATE - INTERVAL '6 months'
            ORDER BY s.release_date DESC, a.name
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }

    /**
     * Get all music entries grouped by date
     * 
     * @return array Array of music entries grouped by date
     */
    public function getAllGroupedByDate(): array {
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.release_date::date as date,
                COALESCE(a.name, '') as artist,
                s.title as song,
                COALESCE(s.stream_url, '') as url,
                'n' as deleted
            FROM songs s
            LEFT JOIN artists a ON s.artist_id = a.id
            WHERE s.feature_on_new_music = true
                AND s.release_date::date > CURRENT_DATE - INTERVAL '6 months'
            ORDER BY s.release_date DESC, a.name
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        // Group by date
        $grouped = [];
        foreach ($results as $row) {
            $row = $this->formatResult($row);
            $date = $row['date'];
            if (!isset($grouped[$date])) {
                $grouped[$date] = [];
            }
            $grouped[$date][] = $row;
        }

        // Sort each date group by artist (ignoring leading articles), then by song title
        foreach ($grouped as $date => $entries) {
            $grouped[$date] = MusicSortUtils::sortEntries($entries);
        }

        return $grouped;
    }

    /**
     * Add a new music entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The music data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating songs.'
        );
    }

    /**
     * Update an existing music entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the music entry to update
     * @param array $data The updated music data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating songs.'
        );
    }

    /**
     * Delete a music entry (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the music entry to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting songs.'
        );
    }

    /**
     * Format a result row to match the expected structure
     * 
     * @param array $row Raw database row
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Format date to only show the date part (YYYY-MM-DD)
        $date = $row['date'];
        if ($date instanceof \DateTime) {
            $date = $date->format('Y-m-d');
        } elseif (is_string($date) && strpos($date, ' ') !== false) {
            // If it's a string with time, extract just the date part
            $date = explode(' ', $date)[0];
        }
        
        return [
            'id' => $row['id'],
            'date' => $date,
            'artist' => $row['artist'],
            'song' => $row['song'],
            'url' => $row['url'],
            'deleted' => $row['deleted']
        ];
    }
}
