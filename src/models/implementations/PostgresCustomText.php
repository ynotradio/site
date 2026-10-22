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

    private function selectPages(string $tail): string {
        return "
            SELECT
                pages.id,
                pages.slug as permalink,
                pages.title,
                pages.content as html,
                pages.content_html,
                pages.content_type,
                pages.center_title,
                pages.legacy_id,
                media.url as header_image_url,
                media.filename as header_image_filename
            FROM pages
            LEFT JOIN media ON media.id = pages.header_image_id
            $tail
        ";
    }

    public function getAll(): array {
        $stmt = $this->db->prepare($this->selectPages("
            WHERE pages._status = 'published'
            ORDER BY pages.title ASC
        "));
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare($this->selectPages("
            WHERE pages.id = :id
                AND pages._status = 'published'
        "));
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    public function findByPermalink(string $permalink): ?array {
        $stmt = $this->db->prepare($this->selectPages("
            WHERE pages.slug IN (:permalink, :slugified)
                AND pages._status = 'published'
            ORDER BY (pages.slug = :exact) DESC
            LIMIT 1
        "));

        $stmt->execute([
            'permalink' => $permalink,
            'exact' => $permalink,
            'slugified' => $this->slugify($permalink),
        ]);
        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        return $this->formatResult($result);
    }

    private function slugify(string $text): string {
        $slug = preg_replace('/[^\w\s-]+/', '', strtolower($text));
        $slug = preg_replace('/\s+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        return trim($slug, '-');
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

    // Same convention as PostgresAd: Cloudinary base + media.filename, untransformed
    // so animated GIF banners are served as uploaded.
    private function headerImageUrl(array $row): string {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME');
        if ($cloudName && !empty($row['header_image_filename'])) {
            return "https://res.cloudinary.com/{$cloudName}/image/upload/{$row['header_image_filename']}";
        }
        return (string) ($row['header_image_url'] ?? '');
    }

    /**
     * pages.php renders `<h1>{title}</h1>`, so the heading is built here: the
     * header image (when set) replaces the title text, and centerTitle wraps
     * the result in <center>, matching the legacy markup. A title that already
     * starts with "<" is legacy HTML and passes through untouched.
     */
    private function renderHeading(array $row): string {
        $title = (string) ($row['title'] ?? '');

        $imageUrl = $this->headerImageUrl($row);
        if ($imageUrl !== '') {
            // media.alt is not used: banners reuse media rows from earlier imports
            // whose alt text is stale (e.g. "logo").
            $heading = sprintf(
                '<img src="%s" alt="%s" width="685">',
                htmlspecialchars($imageUrl, ENT_QUOTES),
                htmlspecialchars(strip_tags($title), ENT_QUOTES)
            );
        } elseif (strpos(ltrim($title), '<') === 0) {
            $heading = $title;
        } else {
            $heading = htmlspecialchars($title, ENT_NOQUOTES);
        }

        return !empty($row['center_title']) ? "<center>$heading</center>" : $heading;
    }

    /**
     * Format result to match the legacy MySQL output shape (id, permalink,
     * title, html, legacy_id).
     *
     * The body is hybrid per page (see the Pages collection): 'html' pages
     * carry a raw-HTML blob in `content_html` that is rendered verbatim;
     * 'richText' pages carry Lexical JSON in `content` (aliased to `html` by
     * the queries) that must be converted, and only those get the legacy
     * per-page fix-ups the lossy conversion needs. Rows predating the split
     * have no `content_type` and are treated as 'richText'.
     */
    private function formatResult(array $row): array {
        $contentType = $row['content_type'] ?? 'richText';
        $row['title'] = $this->renderHeading($row);
        unset(
            $row['center_title'],
            $row['header_image_url'],
            $row['header_image_filename']
        );

        if ($contentType === 'html') {
            // Raw HTML authored in Payload — rendered as-is, no conversion and
            // none of the Lexical-path fix-ups below.
            $row['html'] = $row['content_html'] ?? '';
            unset($row['content_html'], $row['content_type']);
            return $row;
        }

        unset($row['content_html'], $row['content_type']);

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
