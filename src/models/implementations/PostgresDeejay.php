<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Deejay;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Deejay model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresDeejay implements Deejay {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get the Cloudinary URL with transformations for image optimization
     * Matches the generateFileURL function in payload.config.ts but adds transformations
     * 
     * @param string $filename The Cloudinary public_id (e.g., "dev/uploads/1767550468130-a397b55e")
     * @return string The full Cloudinary URL with transformations
     */
    private function getCloudinaryImageUrl(string $filename): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        if (!$cloudName) {
            error_log('PostgresDeejay: CLOUDINARY_CLOUD_NAME environment variable not set');
            return '';
        }
        
        // Use c_fill (crop and fill), w_150 (width), h_150 (height), g_face (focus on face)
        // q_auto (automatic quality), f_auto (automatic format like WebP when supported)
        $transformations = 'c_fill,w_150,h_150,g_face,q_auto,f_auto';
        
        return "https://res.cloudinary.com/{$cloudName}/image/upload/{$transformations}/{$filename}";
    }

    /**
     * Get the Cloudinary base URL for constructing image URLs
     * Matches the generateFileURL function in payload.config.ts
     * 
     * @return string The Cloudinary base URL
     */
    private function getCloudinaryBaseUrl(): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        if (!$cloudName) {
            error_log('PostgresDeejay: CLOUDINARY_CLOUD_NAME environment variable not set');
            return '';
        }
        return "https://res.cloudinary.com/{$cloudName}/image/upload/";
    }

    /**
     * Get a specific deejay by ID
     * 
     * @param int $id The ID of the deejay to retrieve
     * @return array|null The deejay data or null if not found
     */
    public function getById(int $id): ?array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations: fill and crop to 150x150, focus on face, auto quality/format
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_150,h_150,g_face,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                d.id,
                d.email,
                d.description,
                d.external_connect_text,
                d.external_connect_url,
                d.sort_order as sort,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.legacy_url, '')
                END as pic,
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
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations: fill and crop to 150x150, focus on face, auto quality/format
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_150,h_150,g_face,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                d.id,
                d.email,
                d.description,
                d.external_connect_text,
                d.external_connect_url,
                d.sort_order as sort,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.legacy_url, '')
                END as pic,
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
        
        // Format all results
        $results = array_map([$this, 'formatResult'], $results);
        
        // Split into left and right columns (odd/even split)
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
     * Converts Lexical JSON description to plain text for display
     * 
     * @param array $row Raw database result
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Convert Lexical JSON description to plain text for 'show' field
        if (isset($row['description'])) {
            $row['show'] = $this->convertLexicalToText($row['description']);
            unset($row['description']);
        } else {
            $row['show'] = '';
        }
        
        return $row;
    }

    /**
     * Convert Lexical JSON format to plain text
     * Payload CMS stores content in Lexical JSON format, but the frontend expects plain text
     * 
     * @param string $lexicalJson Lexical JSON string
     * @return string Plain text content
     */
    private function convertLexicalToText(string $lexicalJson): string {
        // Try to decode as JSON first
        $lexical = json_decode($lexicalJson, true);
        
        // If it's not valid JSON, assume it's already text
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $lexicalJson;
        }
        
        try {
            if (!isset($lexical['root']['children'])) {
                return $lexicalJson; // Return original if structure is unexpected
            }
            
            $text = '';
            foreach ($lexical['root']['children'] as $node) {
                $text .= $this->extractTextFromNode($node);
            }
            
            return trim($text);
        } catch (\Exception $e) {
            // If conversion fails, return original content
            error_log("PostgresDeejay: Failed to convert Lexical to text: " . $e->getMessage());
            return $lexicalJson;
        }
    }

    /**
     * Extract plain text from a Lexical node
     * 
     * @param array $node Lexical node
     * @return string Plain text
     */
    private function extractTextFromNode(array $node): string {
        $type = $node['type'] ?? '';
        
        switch ($type) {
            case 'paragraph':
            case 'heading':
            case 'listitem':
                $text = $this->extractTextFromChildren($node);
                // Add line break after paragraphs and list items
                return $text . "\n";
                
            case 'list':
                return $this->extractTextFromChildren($node);
                
            case 'text':
                return $node['text'] ?? '';
                
            case 'link':
                return $this->extractTextFromChildren($node);
                
            default:
                // For unknown types, try to extract text from children
                return $this->extractTextFromChildren($node);
        }
    }

    /**
     * Extract text from children of a Lexical node
     * 
     * @param array $node Lexical node with children
     * @return string Combined text from all children
     */
    private function extractTextFromChildren(array $node): string {
        if (!isset($node['children']) || !is_array($node['children'])) {
            return '';
        }
        
        $text = '';
        foreach ($node['children'] as $child) {
            $text .= $this->extractTextFromNode($child);
        }
        
        return $text;
    }
}
