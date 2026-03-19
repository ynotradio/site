<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Ad;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Ad model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresAd implements Ad {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get the Cloudinary base URL for constructing image URLs
     * @return string The Cloudinary base URL
     */
    private function getCloudinaryBaseUrl(): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        if (!$cloudName) {
            error_log('PostgresAd: CLOUDINARY_CLOUD_NAME environment variable not set');
            return '';
        }
        return "https://res.cloudinary.com/{$cloudName}/image/upload";
    }

    /**
     * Build SQL CASE expression for pic_url with Cloudinary transformations
     * @return string The SQL CASE expression
     */
    private function buildPicUrlCase(): string {
        $cloudinaryBase = $this->getCloudinaryBaseUrl();
        $transformations = 'c_fill,w_300,h_250,q_auto,f_auto';

        return "CASE 
            WHEN m.filename IS NOT NULL AND m.filename != '' 
            THEN '{$cloudinaryBase}/{$transformations}/' || m.filename
            ELSE COALESCE(a.image_url, '')
        END as pic_url";
    }

    /**
     * Get a specific ad by ID (regardless of status)
     *
     * @param int $id The ID of the ad to retrieve
     * @return array|null The ad data or null if not found
     */
    public function getById(int $id): ?array {
        $picUrlCase = $this->buildPicUrlCase();

        $stmt = $this->db->prepare("
            SELECT 
                a.id,
                a.name,
                a.start_date,
                a.end_date,
                {$picUrlCase},
                a.web_url,
                a.priority,
                CASE WHEN a._status = 'published' THEN 'n' ELSE 'y' END as deleted
            FROM ads a
            LEFT JOIN media m ON a.image_id = m.id
            WHERE a.id = :id
        ");

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        return $this->formatRow($result);
    }

    /**
     * Get all published ads, ordered by priority
     *
     * @param int $limit Optional limit on number of results
     * @return array Array of ad entries
     */
    public function getAll(int $limit = 64): array {
        $picUrlCase = $this->buildPicUrlCase();

        $stmt = $this->db->prepare("
            SELECT 
                a.id,
                a.name,
                a.start_date,
                a.end_date,
                {$picUrlCase},
                a.web_url,
                a.priority,
                'n' as deleted
            FROM ads a
            LEFT JOIN media m ON a.image_id = m.id
            WHERE a._status = 'published'
            ORDER BY a.priority ASC
            LIMIT :limit
        ");

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Get currently active ads (published, within date range)
     *
     * @return array Array of currently running ad entries
     */
    public function getCurrent(): array {
        $picUrlCase = $this->buildPicUrlCase();

        $stmt = $this->db->prepare("
            SELECT 
                a.id,
                a.name,
                a.start_date,
                a.end_date,
                {$picUrlCase},
                a.web_url,
                a.priority,
                'n' as deleted
            FROM ads a
            LEFT JOIN media m ON a.image_id = m.id
            WHERE a._status = 'published'
              AND a.start_date <= NOW()
              AND a.end_date >= NOW()
            ORDER BY a.priority ASC
        ");

        $stmt->execute();

        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Add a new ad
     * Note: This is a read-only implementation for PostgreSQL
     *
     * @param array $data The ad data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating ads.'
        );
    }

    /**
     * Update an existing ad
     * Note: This is a read-only implementation for PostgreSQL
     *
     * @param int $id The ID of the ad to update
     * @param array $data The updated ad data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating ads.'
        );
    }

    /**
     * Delete an ad
     * Note: This is a read-only implementation for PostgreSQL
     *
     * @param int $id The ID of the ad to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting ads.'
        );
    }

    /**
     * Update the order/priority of an ad
     * Note: This is a read-only implementation for PostgreSQL
     *
     * @param int $id The ID of the ad
     * @param int $priority The new priority value
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function updateOrder(int $id, int $priority): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating ad order.'
        );
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
     * Format a single row to match MySQL output format
     *
     * @param array $row Raw database row
     * @return array Formatted row
     */
    private function formatRow(array $row): array {
        $row['start_date'] = $this->formatDate($row['start_date']);
        $row['end_date'] = $this->formatDate($row['end_date']);
        return $row;
    }

    /**
     * Format results array to match MySQL output format
     *
     * @param array $results Raw database results
     * @return array Formatted results
     */
    private function formatResults(array $results): array {
        return array_map(function ($row) {
            return $this->formatRow($row);
        }, $results);
    }
}
