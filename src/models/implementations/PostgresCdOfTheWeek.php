<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CdOfTheWeek;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the CdOfTheWeek model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresCdOfTheWeek implements CdOfTheWeek {
    use ConvertsLexicalToHtml;

    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get the current CD of the week
     * @return array|null The current CD of the week data or null if none exists
     */
    public function getCurrent(): ?array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations: fill and crop to 200x200, auto quality/format
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                COALESCE(p.name, '') as reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.url, '')
                END as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
            LEFT JOIN people p ON c.reviewer_id = p.id
            WHERE c._status = 'published'
            ORDER BY c.date DESC, c.id DESC
            LIMIT 1
        ");
        
        $stmt->execute();
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get a specific CD of the week by ID
     * @param int $id The ID of the CD of the week to retrieve
     * @return array|null The CD of the week data or null if not found
     */
    public function getById(int $id): ?array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations: fill and crop to 200x200, auto quality/format
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                COALESCE(p.name, '') as reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.url, '')
                END as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
            LEFT JOIN people p ON c.reviewer_id = p.id
            WHERE (c.id = :id OR c.legacy_id = :legacy_id)
              AND c._status = 'published'
        ");
        
        $stmt->execute([
            'id' => $id,
            'legacy_id' => $id,
        ]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get all CDs of the week, optionally limited to a specific number
     * @param int $limit Optional limit on number of results
     * @return array Array of CD of the week entries
     */
    public function getAll(int $limit = 64): array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations: fill and crop to 100x100, auto quality/format for thumbnails
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_100,h_100,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                COALESCE(p.name, '') as reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.url, '')
                END as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
            LEFT JOIN people p ON c.reviewer_id = p.id
            WHERE c._status = 'published'
            ORDER BY c.date DESC, c.id DESC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $results = $stmt->fetchAll();
        return array_map([$this, 'formatResult'], $results);
    }

    /**
     * Add a new CD of the week
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The CD of the week data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating CD of the Week entries.'
        );
    }

    /**
     * Update an existing CD of the week
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the CD of the week to update
     * @param array $data The updated CD of the week data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating CD of the Week entries.'
        );
    }

    /**
     * Delete a CD of the week (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the CD of the week to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting CD of the Week entries.'
        );
    }

    /**
     * Format a single result to match MySQL output format
     * Converts Lexical JSON review to HTML for display
     * 
     * @param array $row Raw database result
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Format date to MySQL format (YYYY-MM-DD)
        if (isset($row['date'])) {
            $row['date'] = $this->formatDate($row['date']);
        }
        
        // Convert Lexical JSON review to HTML for display
        if (isset($row['review'])) {
            $row['review'] = $this->convertLexicalToHtml($row['review']);
        }
        
        return $row;
    }

    /**
     * Format PostgreSQL timestamp/date to MySQL date format (YYYY-MM-DD)
     * 
     * @param string $timestamp PostgreSQL timestamp or date
     * @return string MySQL date format
     */
    private function formatDate(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('Y-m-d');
    }
}
