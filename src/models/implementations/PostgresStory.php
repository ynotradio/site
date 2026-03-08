<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Story;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Story model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresStory implements Story {
    private PDO $db;

    // Lexical text format bit flags
    private const FORMAT_BOLD = 1;
    private const FORMAT_ITALIC = 2;
    private const FORMAT_UNDERLINE = 8;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get a specific story by ID
     * 
     * @param int $id The ID of the story to retrieve
     * @return array|null The story data or null if not found
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                p.id,
                p.headline,
                p.start_date,
                p.end_date,
                p.content,
                p.priority,
                COALESCE(m.url, p.image_url, '') as pic,
                COALESCE(p.link_url, '') as pic_url,
                'n' as deleted
            FROM posts p
            LEFT JOIN media m ON p.image_id = m.id
            WHERE p.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get all active stories, optionally limited to a specific number
     * 
     * @param mixed $amount 'all' for all stories, or a number to limit
     * @return array Array of arrays, with odd and even stories separated
     */
    public function getAll($amount = 'all'): array {
        $query = "
            SELECT 
                p.id,
                p.headline,
                p.start_date,
                p.end_date,
                p.content,
                p.priority,
                COALESCE(m.url, p.image_url, '') as pic,
                COALESCE(p.link_url, '') as pic_url,
                'n' as deleted
            FROM posts p
            LEFT JOIN media m ON p.image_id = m.id
            WHERE p._status = 'published'
                AND p.show_on_front_page = true
                AND p.start_date::date <= CURRENT_DATE
                AND p.end_date::date >= CURRENT_DATE
            ORDER BY p.priority ASC, p.id ASC
        ";
        
        if ($amount !== 'all') {
            $query .= " LIMIT :limit";
        }
        
        $stmt = $this->db->prepare($query);
        
        if ($amount !== 'all') {
            $stmt->bindValue(':limit', intval($amount), PDO::PARAM_INT);
        }
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        // Transform results to match expected format
        $results = array_map([$this, 'formatResult'], $results);
        
        // Split into odd and even arrays (for two-column layout)
        $odd_results = [];
        $even_results = [];
        
        foreach ($results as $i => $result) {
            if ($i % 2 === 0) {
                $odd_results[] = $result;
            } else {
                $even_results[] = $result;
            }
        }
        
        return [$odd_results, $even_results];
    }

    /**
     * Add a new story
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The story data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating posts.'
        );
    }

    /**
     * Update an existing story
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the story to update
     * @param array $data The updated story data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating posts.'
        );
    }

    /**
     * Delete a story (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the story to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting posts.'
        );
    }

    /**
     * Update the priority of stories
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $priorities Array of story IDs => priorities
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function updatePriorities(array $priorities): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating priorities.'
        );
    }

    /**
     * Get all active stories for admin view
     * 
     * @return array Array of story entries
     */
    public function getAllActive(): array {
        $stmt = $this->db->prepare("
            SELECT 
                p.id,
                p.headline,
                p.start_date,
                p.end_date,
                p.content,
                p.priority,
                COALESCE(m.url, p.image_url, '') as pic,
                COALESCE(p.link_url, '') as pic_url,
                'n' as deleted
            FROM posts p
            LEFT JOIN media m ON p.image_id = m.id
            WHERE p._status = 'published'
                AND p.show_on_front_page = true
                AND p.end_date::date >= CURRENT_DATE
            ORDER BY p.priority ASC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }

    /**
     * Format a single result to match MySQL output format
     * Converts Lexical JSON content to HTML for display
     * 
     * @param array $row Raw database result
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Format dates to MySQL format (YYYY-MM-DD)
        if (isset($row['start_date'])) {
            $row['start_date'] = $this->formatDate($row['start_date']);
        }
        if (isset($row['end_date'])) {
            $row['end_date'] = $this->formatDate($row['end_date']);
        }
        
        // Convert Lexical JSON content to HTML for display
        if (isset($row['content'])) {
            $row['story'] = $this->convertLexicalToHtml($row['content']);
            unset($row['content']);
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
            error_log("PostgresStory: Content is not valid JSON, treating as HTML: " . 
                substr($lexicalJson, 0, 100));
            return $lexicalJson;
        }
        
        try {
            if (!isset($lexical['root']['children'])) {
                error_log("PostgresStory: Invalid Lexical structure, missing root.children");
                return $lexicalJson; // Return original if structure is unexpected
            }
            
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node);
            }
            
            return $html;
        } catch (\Exception $e) {
            // If conversion fails, return original content
            error_log("PostgresStory: Failed to convert Lexical to HTML: " . $e->getMessage());
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
                $text = $node['text'] ?? '';
                $format = $node['format'] ?? 0;
                
                // Don't escape HTML - content was imported with HTML tags as plain text
                // These should render as actual HTML, not escaped entities
                
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
        $firstChar = substr($url, 0, 1);
        
        if ($firstChar === '/' || $firstChar === '#') {
            return true;
        }
        
        $parsed = parse_url($url);
        
        if ($parsed === false || !isset($parsed['scheme'])) {
            return $parsed !== false;
        }
        
        $scheme = strtolower($parsed['scheme']);
        return $scheme === 'http' || $scheme === 'https';
    }
}
