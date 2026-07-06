<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CustomText;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use PDO;

/**
 * PostgreSQL implementation of the CustomText model
 * Reads from Neon PostgreSQL database (posts collection, type='custom_text')
 */
class PostgresCustomText implements CustomText {
    use ConvertsLexicalToHtml;

    private PDO $db;

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
            FROM pages
            WHERE _status = 'published'
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
            FROM pages
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
                title,
                content as html,
                legacy_id
            FROM pages
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
        // This implementation checks the pages table only. The method is
        // defined on the CustomText interface (which predates the pages/posts
        // split); here it answers "is this permalink already taken in pages?".
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as count
            FROM pages
            WHERE slug = :permalink 
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
                '<a href="http://rodneyanonymous.com/" target="_blank"><b><i>FIND MORE PREVIOUS EPISODES HERE >></i></b></a>' . "\n",
                $row['html']
            );
        }
        
        return $row;
    }
}
