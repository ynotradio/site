<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Deejay;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Deejay model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresDeejay implements Deejay {
    use ConvertsLexicalToHtml;

    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get the Cloudinary URL with transformations for image optimization
     * @param string $filename The Cloudinary public_id
     * @return string The full Cloudinary URL with transformations
     */
    private function getCloudinaryImageUrl(string $filename): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        if (!$cloudName) {
            error_log('PostgresDeejay: CLOUDINARY_CLOUD_NAME environment variable not set');
            return '';
        }
        
        $transformations = 'c_fill,w_150,h_150,g_face,q_auto,f_auto';
        return "https://res.cloudinary.com/{$cloudName}/image/upload/{$transformations}/{$filename}";
    }

    /**
     * Build SQL CASE expression for photo URL with Cloudinary transformations
     * @return string The SQL CASE expression
     */
    private function buildPhotoUrlCase(): string {
        $cloudinaryUrl = $this->getCloudinaryBaseUrl();
        $transformations = 'c_fill,w_150,h_150,g_face,q_auto,f_auto';
        
        return "CASE 
            WHEN m.filename IS NOT NULL AND m.filename != '' 
            THEN '{$cloudinaryUrl}{$transformations}/' || m.filename
            ELSE COALESCE(m.legacy_url, '')
        END as pic";
    }

    /**
     * Get the Cloudinary base URL for constructing image URLs
     * @return string The Cloudinary base URL
     */
    private function getCloudinaryBaseUrl(): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        return "https://res.cloudinary.com/{$cloudName}/image/upload/";
    }

    /**
     * Get a specific deejay by ID
     * 
     * @param int $id The ID of the deejay to retrieve
     * @return array|null The deejay data or null if not found
     */
    public function getById(int $id): ?array {
        $photoUrlCase = $this->buildPhotoUrlCase();
        
        $stmt = $this->db->prepare("
            SELECT 
                d.id,
                d.email,
                d.description,
                d.external_connect_text,
                d.external_connect_url,
                d.sort_order as sort,
                {$photoUrlCase},
                string_agg(p.name, ' & ' ORDER BY dr.order) as name,
                'no' as deleted
            FROM djs d
            LEFT JOIN djs_rels dr ON d.id = dr.parent_id AND dr.path = 'person'
            LEFT JOIN people p ON dr.people_id = p.id
            LEFT JOIN media m ON d.photo_id = m.id
            WHERE d.id = :id 
              AND COALESCE(d.on_air, true) = true
              AND d._status = 'published'
            GROUP BY d.id, d.email, d.description, d.external_connect_text, 
                     d.external_connect_url, d.sort_order, m.filename, m.legacy_url
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get all deejays, optionally limited to a specific number
     * Returns array of two arrays (left column, right column) for display
     * 
     * @param int $limit Optional limit on number of results
     * @return array Array of two arrays [left_column, right_column]
     */
    public function getAll(int $limit = 64): array {
        $photoUrlCase = $this->buildPhotoUrlCase();
        
        $stmt = $this->db->prepare("
            SELECT 
                d.id,
                d.email,
                d.description,
                d.external_connect_text,
                d.external_connect_url,
                d.sort_order as sort,
                {$photoUrlCase},
                string_agg(p.name, ' & ' ORDER BY dr.order) as name,
                'no' as deleted
            FROM djs d
            LEFT JOIN djs_rels dr ON d.id = dr.parent_id AND dr.path = 'person'
            LEFT JOIN people p ON dr.people_id = p.id
            LEFT JOIN media m ON d.photo_id = m.id
            WHERE COALESCE(d.on_air, true) = true
              AND d._status = 'published'
            GROUP BY d.id, d.email, d.description, d.external_connect_text, 
                     d.external_connect_url, d.sort_order, m.filename, m.legacy_url
            ORDER BY d.sort_order ASC
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $results = $stmt->fetchAll();
        $results = array_map([$this, 'formatResult'], $results);
        
        return $this->splitIntoColumns($results);
    }

    /**
     * Split results into left and right columns for display
     * @param array $results Formatted results
     * @return array Array of two arrays [left_column, right_column]
     */
    private function splitIntoColumns(array $results): array {
        $left_column = [];
        $right_column = [];
        
        for ($i = 0; $i < count($results); $i++) {
            if ($i % 2 === 0) {
                $left_column[] = $results[$i];
            } else {
                $right_column[] = $results[$i];
            }
        }
        
        return [$left_column, $right_column];
    }

    /**
     * Add a new deejay
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The deejay data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating DJs.'
        );
    }

    /**
     * Update an existing deejay
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the deejay to update
     * @param array $data The updated deejay data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating DJs.'
        );
    }

    /**
     * Delete a deejay (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the deejay to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting DJs.'
        );
    }

    /**
     * Get the name of a deejay by ID
     * 
     * @param int $id The ID of the deejay
     * @return string The name of the deejay
     */
    public function getName(int $id): string {
        $deejay = $this->getById($id);
        if (!$deejay) {
            throw new \RuntimeException("Deejay not found with ID: $id");
        }
        return $deejay['name'];
    }

    /**
     * Update the sort order of deejays
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $items Array of deejay IDs in the desired order
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function updateSortOrder(array $items): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating sort order.'
        );
    }

    /**
     * Format a single result to match MySQL output format
     * Converts Lexical JSON description to HTML for display
     *
     * @param array $row Raw database result
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Convert Lexical JSON description to HTML for 'show' field
        if (isset($row['description'])) {
            $row['show'] = $this->convertLexicalToHtml($row['description']);
            unset($row['description']);
        } else {
            $row['show'] = '';
        }

        return $row;
    }
}
