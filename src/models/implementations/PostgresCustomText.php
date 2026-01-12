<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CustomText;
use PDO;

/**
 * PostgreSQL implementation of the CustomText model
 * Reads from Neon PostgreSQL database (posts collection, type='custom_text')
 */
class PostgresCustomText implements CustomText {
    private PDO $db;

    // Lexical text format bit flags
    private const FORMAT_BOLD = 1;
    private const FORMAT_ITALIC = 2;
    private const FORMAT_UNDERLINE = 8;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getAll(): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug as permalink,
                title,
                content as html,
                legacy_id
            FROM posts
            WHERE type = 'custom_text'
                AND _status = 'published'
            ORDER BY title ASC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug as permalink,
                title,
                content as html,
                legacy_id
            FROM posts
            WHERE id = :id 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    public function findByPermalink(string $permalink): ?array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                slug as permalink,
                title,
                content as html,
                legacy_id
            FROM posts
            WHERE slug = :permalink 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['permalink' => $permalink]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }

    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }

    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API.'
        );
    }

    public function isValidPermalink(string $permalink): bool {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count
            FROM posts
            WHERE slug = :permalink 
                AND type = 'custom_text'
                AND _status = 'published'
        ");
        
        $stmt->execute(['permalink' => $permalink]);
        $result = $stmt->fetch();
        
        return $result['count'] == 0;
    }

    public function createPermalink(string $title): string {
        // Simple permalink creation - lowercase, replace spaces with hyphens
        $permalink = strtolower($title);
        $permalink = preg_replace('/[^a-z0-9]+/', '-', $permalink);
        $permalink = trim($permalink, '-');
        
        return $permalink;
    }

    /**
     * Format result to match MySQL output and convert Lexical to HTML
     */
    private function formatResult(array $row): array {
        // Convert Lexical JSON content to HTML
        if (isset($row['html'])) {
            $row['html'] = $this->convertLexicalToHtml($row['html']);
        }
        
        return $row;
    }

    /**
     * Convert Lexical JSON format to HTML
     */
    private function convertLexicalToHtml(string $lexicalJson): string {
        $lexical = json_decode($lexicalJson, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $lexicalJson;
        }
        
        try {
            if (!isset($lexical['root']['children'])) {
                return $lexicalJson;
            }
            
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node);
            }
            
            return $html;
        } catch (\Exception $e) {
            error_log("PostgresCustomText: Failed to convert Lexical to HTML: " . $e->getMessage());
            return $lexicalJson;
        }
    }

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
                $url = $this->isValidUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                $content = $this->convertLexicalChildren($node);
                return "<a href=\"$url\">$content</a>";
                
            case 'text':
                $text = htmlspecialchars($node['text'] ?? '', ENT_QUOTES, 'UTF-8');
                $format = $node['format'] ?? 0;
                
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
                return $this->convertLexicalChildren($node);
        }
    }

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

    private function isValidUrl(string $url): bool {
        if (substr($url, 0, 1) === '/' || substr($url, 0, 1) === '#') {
            return true;
        }
        
        $parsed = parse_url($url);
        
        if ($parsed === false) {
            return false;
        }
        
        if (isset($parsed['scheme'])) {
            $scheme = strtolower($parsed['scheme']);
            return $scheme === 'http' || $scheme === 'https';
        }
        
        return true;
    }
}
