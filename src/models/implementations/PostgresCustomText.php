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
                headline as title,
                content as html,
                legacy_id
            FROM posts
            WHERE _status = 'published'
            ORDER BY headline ASC
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
                headline as title,
                content as html,
                legacy_id
            FROM posts
            WHERE id = :id 
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
                headline as title,
                content as html,
                legacy_id
            FROM posts
            WHERE slug = :permalink 
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
        
        // Special handling for Future Friday page - use image instead of text title and add CSS
        if (isset($row['permalink']) && $row['permalink'] === 'future-friday') {
            if (isset($row['title'])) {
                $row['title'] = '<img src="https://i.imgur.com/1QIvI46.png" width="685">';
            }
            
            // Prepend CSS styling for tables
            $tableCSS = '<style type="text/css">body table { font-size: small; }</style>' . "\n";
            $row['html'] = $tableCSS . $row['html'];
        }
        
        // Special handling for Rodney Anonymous page - replace plain text with archive link
        if (isset($row['permalink']) && $row['permalink'] === 'rodney-anonymous') {
            // Remove the plain text paragraph and replace with styled link
            $row['html'] = preg_replace(
                '/<p>FIND MORE PREVIOUS EPISODES HERE >><\/p>\s*$/s',
                '<a href="http://rodneyanonymous.com/" target=_blank><b><i>FIND MORE PREVIOUS EPISODES HERE >></i></b></a>' . "\n",
                $row['html']
            );
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
                
                // Check if this paragraph contains a table marker
                if (strpos($content, '[Table]') === 0) {
                    return $this->convertTableMarkupToHtml($content);
                }
                
                $format = $node['format'] ?? '';
                return $this->wrapInBlock('p', $content, $format);
                
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
                // Payload stores links with fields.url structure
                $rawUrl = $node['fields']['url'] ?? $node['url'] ?? '';
                $url = $this->isValidUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                $content = $this->convertLexicalChildren($node);
                return "<a href=\"$url\">$content</a>";
                
            case 'block':
                // Handle Payload CMS block types (embeds, etc.)
                $fields = $node['fields'] ?? [];
                $blockType = $fields['blockType'] ?? '';
                
                if ($blockType === 'embed' && !empty($fields['url'])) {
                    $url = $fields['url'];
                    $escapedUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                    
                    // Check if it's a MixCloud embed
                    if (strpos($url, 'mixcloud.com') !== false) {
                        return "<br><br>\n<iframe width=\"100%\" height=\"60\" src=\"$escapedUrl\" frameborder=\"0\" ></iframe>\n<br><br>\n";
                    }
                    
                    // Generic iframe for other embeds
                    return "<br><br>\n<iframe src=\"$escapedUrl\" frameborder=\"0\"></iframe>\n<br><br>\n";
                }
                
                return '';
                
            case 'text':
                $text = $node['text'] ?? '';
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

    /**
     * Convert [Table] markup to HTML table
     * Format: [Table] HEADER1 | HEADER2 | HEADER3 Row1Col1 | Row1Col2 | Row1Col3 ...
     */
    private function convertTableMarkupToHtml(string $content): string {
        // Remove [Table] prefix
        $content = trim(substr($content, 7));
        
        // Split by newlines or multiple spaces to get rows
        $lines = preg_split('/\s{2,}|\n/', $content);
        if (empty($lines)) {
            return '';
        }
        
        // Use the same styling as the original MySQL version
        $html = '<table width="100%" cellspacing="0" cellpadding="0">' . "\n";
        $html .= '  <colgroup><col width="33%" span="3"></colgroup>' . "\n";
        $html .= '  <tbody>' . "\n";
        
        // First line is headers - black background with white text
        $headers = array_map('trim', explode('|', array_shift($lines)));
        $html .= '  <tr>' . "\n";
        foreach ($headers as $header) {
            $escaped = htmlspecialchars($header, ENT_QUOTES, 'UTF-8');
            $html .= '    <td width="33%" bgcolor="#000000"><font color="#FFFFFF"><strong>' . $escaped . '</strong></font></td>' . "\n";
        }
        $html .= '  </tr>' . "\n";
        
        // Remaining lines are data rows - alternate gray/white
        $rowIndex = 0;
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            $cells = array_map('trim', explode('|', $line));
            
            // Alternate row colors: white, gray (#CCCCCC)
            $bgcolor = ($rowIndex % 2 === 1) ? ' bgcolor="#CCCCCC"' : '';
            $html .= '  <tr' . $bgcolor . '>' . "\n";
            
            foreach ($cells as $cell) {
                $escaped = htmlspecialchars($cell, ENT_QUOTES, 'UTF-8');
                $html .= '    <td valign="top"><p>' . $escaped . '</p></td>' . "\n";
            }
            $html .= '  </tr>' . "\n";
            
            $rowIndex++;
        }
        $html .= '  </tbody>' . "\n";
        $html .= '</table>' . "\n";
        
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
