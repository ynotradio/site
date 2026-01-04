<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CdOfTheWeek;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the CdOfTheWeek model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresCdOfTheWeek implements CdOfTheWeek {
    private PDO $db;

    // Lexical text format bit flags
    private const FORMAT_BOLD = 1;
    private const FORMAT_ITALIC = 2;
    private const FORMAT_UNDERLINE = 8;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get the current CD of the week
     * @return array|null The current CD of the week data or null if none exists
     */
    public function getCurrent(): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                COALESCE(m.url, '') as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
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
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                COALESCE(m.url, '') as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
            WHERE c.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
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
        $stmt = $this->db->prepare("
            SELECT 
                c.id,
                c.date,
                c.reviewer,
                c.review,
                r.title,
                r.label,
                a.name as artist,
                COALESCE(a.website, '') as band,
                COALESCE(m.url, '') as cd_pic_url,
                'no' as deleted
            FROM cdoftheweek c
            LEFT JOIN records r ON c.record_id = r.id
            LEFT JOIN artists a ON r.artist_id = a.id
            LEFT JOIN media m ON r.cover_image_id = m.id
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

    /**
     * Convert Lexical JSON format to HTML
     * Payload CMS stores content in Lexical JSON format, but the frontend expects HTML
     * 
     * @param string $lexicalJson Lexical JSON string
     * @return string HTML content
     */
    private function convertLexicalToHtml(string $lexicalJson): string {
        // Try to decode as JSON first
        $lexical = json_decode($lexicalJson, true);
        
        // If it's not valid JSON, assume it's already HTML
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("PostgresCdOfTheWeek: Content is not valid JSON, treating as HTML: " . 
                substr($lexicalJson, 0, 100));
            return $lexicalJson;
        }
        
        try {
            if (!isset($lexical['root']['children'])) {
                error_log("PostgresCdOfTheWeek: Invalid Lexical structure, missing root.children");
                return $lexicalJson; // Return original if structure is unexpected
            }
            
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node);
            }
            
            return $html;
        } catch (\Exception $e) {
            // If conversion fails, return original content
            error_log("PostgresCdOfTheWeek: Failed to convert Lexical to HTML: " . $e->getMessage());
            return $lexicalJson;
        }
    }

    /**
     * Convert a single Lexical node to HTML
     * 
     * @param array $node Lexical node
     * @return string HTML representation
     */
    private function convertLexicalNodeToHtml(array $node): string {
        $type = $node['type'] ?? '';
        
        switch ($type) {
            case 'paragraph':
                $content = $this->convertLexicalChildren($node);
                return "<p>$content</p>\n";
                
            case 'heading':
                $tag = $node['tag'] ?? 'h2';
                $content = $this->convertLexicalChildren($node);
                return "<$tag>$content</$tag>\n";
                
            case 'list':
                $listType = $node['listType'] ?? 'bullet';
                $tag = $listType === 'number' ? 'ol' : 'ul';
                $content = $this->convertLexicalChildren($node);
                return "<$tag>$content</$tag>\n";
                
            case 'listitem':
                $content = $this->convertLexicalChildren($node);
                return "<li>$content</li>\n";
                
            case 'link':
                $rawUrl = $node['url'] ?? '';
                // Validate URL first, then apply fallback if invalid
                $url = $this->isValidUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                $content = $this->convertLexicalChildren($node);
                return "<a href=\"$url\">$content</a>";
                
            case 'text':
                $text = htmlspecialchars($node['text'] ?? '', ENT_QUOTES, 'UTF-8');
                $format = $node['format'] ?? 0;
                
                // Apply text formatting using defined constants
                if ($format & self::FORMAT_BOLD) {
                    $text = "<strong>$text</strong>";
                }
                if ($format & self::FORMAT_ITALIC) {
                    $text = "<em>$text</em>";
                }
                if ($format & self::FORMAT_UNDERLINE) {
                    $text = "<u>$text</u>";
                }
                
                return $text;
                
            default:
                // For unknown types, try to render children
                return $this->convertLexicalChildren($node);
        }
    }

    /**
     * Convert children of a Lexical node to HTML
     * 
     * @param array $node Lexical node with children
     * @return string HTML representation of children
     */
    private function convertLexicalChildren(array $node): string {
        if (!isset($node['children']) || !is_array($node['children'])) {
            return '';
        }
        
        $html = '';
        foreach ($node['children'] as $child) {
            $html .= $this->convertLexicalNodeToHtml($child);
        }
        
        return $html;
    }

    /**
     * Validate URL to prevent XSS attacks
     * Only allows http, https, and relative URLs
     * 
     * @param string $url URL to validate
     * @return bool True if URL is valid and safe
     */
    private function isValidUrl(string $url): bool {
        // Allow relative URLs
        if (substr($url, 0, 1) === '/') {
            return true;
        }
        
        // Allow anchors
        if (substr($url, 0, 1) === '#') {
            return true;
        }
        
        // Parse the URL
        $parsed = parse_url($url);
        
        if ($parsed === false) {
            return false;
        }
        
        // If there's a scheme, it must be http or https
        if (isset($parsed['scheme'])) {
            $scheme = strtolower($parsed['scheme']);
            return $scheme === 'http' || $scheme === 'https';
        }
        
        // No scheme means relative URL - allowed
        return true;
    }
}
