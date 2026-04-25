<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Concert;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Concert model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresConcert implements Concert {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get a specific concert by ID
     * 
     * @param int $id The ID of the concert to retrieve
     * @return array|null The concert data or null if not found
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.venue_id,
                c.ticket_info as ticketinfo,
                c.ticket_url as ticketurl,
                v.name as venue,
                COALESCE(NULLIF(c.title, ''), string_agg(a.name, ', ' ORDER BY cr.order)) as artist,
                COALESCE(a_first.website, '') as band_url,
                COALESCE(a_first_photo.url, '') as band_pic_url,
                'n' as deleted
            FROM concerts c
            LEFT JOIN venues v ON c.venue_id = v.id
            LEFT JOIN concerts_rels cr ON c.id = cr.parent_id AND cr.path = 'artists'
            LEFT JOIN artists a ON cr.artists_id = a.id
            LEFT JOIN LATERAL (
                SELECT ar.id, ar.website, ar.photo_id
                FROM concerts_rels crr
                JOIN artists ar ON crr.artists_id = ar.id
                WHERE crr.parent_id = c.id AND crr.path = 'artists'
                ORDER BY crr.order
                LIMIT 1
            ) a_first ON true
            LEFT JOIN media a_first_photo ON a_first.photo_id = a_first_photo.id
            WHERE c.id = :id
            GROUP BY c.id, c.date, c.venue_id, c.ticket_info, c.ticket_url, c.title,
                     v.name, a_first.website, a_first_photo.url
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        $result['date'] = $this->formatDate($result['date']);
        $result['featured'] = 'No';
        
        return $result;
    }

    /**
     * Get all concerts, optionally limited to a specific number
     * 
     * @param int $limit Optional limit on number of results
     * @return array Array of concert entries
     */
    public function getAll(int $limit = 64): array {
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.venue_id,
                c.ticket_info as ticketinfo,
                c.ticket_url as ticketurl,
                v.name as venue,
                COALESCE(NULLIF(c.title, ''), string_agg(a.name, ', ' ORDER BY cr.order)) as artist,
                COALESCE(a_first.website, '') as band_url,
                COALESCE(a_first_photo.url, '') as band_pic_url,
                'n' as deleted
            FROM concerts c
            LEFT JOIN venues v ON c.venue_id = v.id
            LEFT JOIN concerts_rels cr ON c.id = cr.parent_id AND cr.path = 'artists'
            LEFT JOIN artists a ON cr.artists_id = a.id
            LEFT JOIN LATERAL (
                SELECT ar.id, ar.website, ar.photo_id
                FROM concerts_rels crr
                JOIN artists ar ON crr.artists_id = ar.id
                WHERE crr.parent_id = c.id AND crr.path = 'artists'
                ORDER BY crr.order
                LIMIT 1
            ) a_first ON true
            LEFT JOIN media a_first_photo ON a_first.photo_id = a_first_photo.id
            GROUP BY c.id, c.date, c.venue_id, c.ticket_info, c.ticket_url, c.title,
                     v.name, a_first.website, a_first_photo.url
            ORDER BY c.date DESC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Get upcoming concerts (not deleted, date >= current date)
     * 
     * @param int $limit Optional limit on number of results
     * @return array Array of upcoming concert entries
     */
    public function getUpcoming(int $limit = 500): array {
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.venue_id,
                c.ticket_info as ticketinfo,
                c.ticket_url as ticketurl,
                v.name as venue,
                COALESCE(NULLIF(c.title, ''), string_agg(a.name, ', ' ORDER BY cr.order)) as artist,
                COALESCE(a_first.website, '') as band_url,
                COALESCE(a_first_photo.url, '') as band_pic_url,
                'n' as deleted
            FROM concerts c
            LEFT JOIN venues v ON c.venue_id = v.id
            LEFT JOIN concerts_rels cr ON c.id = cr.parent_id AND cr.path = 'artists'
            LEFT JOIN artists a ON cr.artists_id = a.id
            LEFT JOIN LATERAL (
                SELECT ar.id, ar.website, ar.photo_id
                FROM concerts_rels crr
                JOIN artists ar ON crr.artists_id = ar.id
                WHERE crr.parent_id = c.id AND crr.path = 'artists'
                ORDER BY crr.order
                LIMIT 1
            ) a_first ON true
            LEFT JOIN media a_first_photo ON a_first.photo_id = a_first_photo.id
            WHERE c.date::date >= CURRENT_DATE
              AND c._status = 'published'
            GROUP BY c.id, c.date, c.venue_id, c.ticket_info, c.ticket_url, c.title,
                     v.name, a_first.website, a_first_photo.url
            ORDER BY c.date ASC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Get featured concerts
     * 
     * @param int $limit Optional limit on number of results
     * @return array Array of featured concert entries
     */
    public function getFeatured(int $limit = 5): array {
        // Featured concerts have been removed from the Payload schema.
        // Method retained to satisfy the Concert interface; always returns [].
        return [];
    }

    /**
     * Add a new concert
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The concert data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating concerts.'
        );
    }

    /**
     * Update an existing concert
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the concert to update
     * @param array $data The updated concert data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating concerts.'
        );
    }

    /**
     * Delete a concert (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the concert to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting concerts.'
        );
    }

    /**
     * Get concert info as a string (artist at venue)
     * 
     * @param int $id The ID of the concert
     * @return string The concert info string
     */
    public function getConcertInfo(int $id): string {
        $concert = $this->getById($id);
        
        if (!$concert) {
            throw new \RuntimeException("Concert not found with ID: $id");
        }
        
        return $concert['artist'] . " at " . $concert['venue'];
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
     * Format results array to match MySQL output format
     * 
     * @param array $results Raw database results
     * @return array Formatted results
     */
    private function formatResults(array $results): array {
        return array_map(function($row) {
            $row['date'] = $this->formatDate($row['date']);
            $row['featured'] = 'No';
            return $row;
        }, $results);
    }
}
