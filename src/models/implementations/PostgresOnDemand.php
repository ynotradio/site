<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\OnDemand;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the OnDemand model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresOnDemand implements OnDemand {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get a specific on demand entry by ID
     * 
     * @param int $id The ID of the on demand entry to retrieve
     * @return array|null The on demand data or null if not found
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                od.id,
                od.date,
                COALESCE(m.url, m.filename, '') as image,
                od.headline,
                od.note,
                od.songs,
                od.audio_url,
                COALESCE(od.source, 'opendrive') as source
            FROM ondemand od
            LEFT JOIN media m ON od.image_id = m.id
            WHERE od.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        // Convert PostgreSQL timestamp to MySQL date format
        $result['date'] = $this->formatDate($result['date']);
        
        return $result;
    }

    /**
     * Get all on demand entries, filtered by page and sort order
     * 
     * @param string $sort The sort order ('date', 'artist', or 'text')
     * @param int $page The page number
     * @param int $limit Items per page
     * @return array Array of on demand entries
     */
    public function getAll(string $sort = 'date', int $page = 1, int $limit = 5): array {
        if ($sort === 'text') {
            return $this->getAllTextList();
        }
        
        // Calculate the starting position for pagination
        $offset = ($page - 1) * $limit;
        
        // Determine order by clause
        $orderBy = ($sort === 'date') ? 'date DESC' : 'headline ASC';
        
        $stmt = $this->db->prepare("
            SELECT 
                od.id,
                od.date,
                COALESCE(m.url, m.filename, '') as image,
                od.headline,
                od.note,
                od.songs,
                od.audio_url
            FROM ondemand od
            LEFT JOIN media m ON od.image_id = m.id
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Get all on demand entries as a text list (headline and date only)
     * 
     * @return array Array of on demand entries with id, headline, and fdate
     */
    private function getAllTextList(): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                headline,
                date
            FROM ondemand
            ORDER BY headline ASC, date DESC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map(function($row) {
            return [
                'id' => $row['id'],
                'headline' => $row['headline'],
                'fdate' => $this->formatDateShort($row['date'])
            ];
        }, $results);
    }

    /**
     * Get total count of active on demand entries
     * 
     * @return int The total count
     */
    public function getTotalCount(): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as num
            FROM ondemand
        ");
        
        $stmt->execute();
        $row = $stmt->fetch();
        
        return (int)$row['num'];
    }

    /**
     * Add a new on demand entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The on demand data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating on-demand entries.'
        );
    }

    /**
     * Update an existing on demand entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the on demand entry to update
     * @param array $data The updated on demand data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating on-demand entries.'
        );
    }

    /**
     * Delete an on demand entry (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the on demand entry to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting on-demand entries.'
        );
    }

    /**
     * Get all active on demand entries for admin view
     * 
     * @return array Array of on demand entries
     */
    public function getAllForAdmin(): array {
        $stmt = $this->db->prepare("
            SELECT 
                od.id,
                od.date,
                COALESCE(m.url, m.filename, '') as image,
                od.headline,
                od.note,
                od.songs,
                od.audio_url,
                COALESCE(od.source, 'opendrive') as source
            FROM ondemand od
            LEFT JOIN media m ON od.image_id = m.id
            ORDER BY od.date DESC
        ");
        
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Format PostgreSQL timestamp to MySQL date format (YYYY-MM-DD)
     * 
     * @param string $timestamp PostgreSQL timestamp
     * @return string MySQL date format
     */
    private function formatDate(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('Y-m-d');
    }

    /**
     * Format PostgreSQL timestamp to short date format (mm/dd/yy)
     * 
     * @param string $timestamp PostgreSQL timestamp
     * @return string Short date format
     */
    private function formatDateShort(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('m/d/y');
    }

    /**
     * Format results array to match MySQL output format
     * 
     * @param array $results Raw database results
     * @return array Formatted results
     */
    private function formatResults(array $results): array {
        return array_map(function($row) {
            if (isset($row['date'])) {
                $row['fdate'] = $this->formatDateShort($row['date']);
                $row['date'] = $this->formatDate($row['date']);
            }
            return $row;
        }, $results);
    }
}
