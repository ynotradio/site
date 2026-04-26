<?php

namespace YNotRadio\Models\Concerns;

/**
 * Converts Payload CMS Lexical JSON content to HTML.
 *
 * Payload stores rich text as Lexical JSON, but the legacy PHP frontend
 * templates expect HTML strings. This trait keeps the conversion in one place
 * so every Postgres-backed read model returns display-ready markup.
 */
trait ConvertsLexicalToHtml
{
    // Lexical text format bit flags
    private static int $LEXICAL_FORMAT_BOLD = 1;
    private static int $LEXICAL_FORMAT_ITALIC = 2;
    private static int $LEXICAL_FORMAT_UNDERLINE = 8;

    /**
     * Convert a Lexical JSON string to HTML. If the input isn't valid JSON or
     * doesn't have the expected structure, the original string is returned
     * untouched (treated as already-HTML legacy content).
     */
    protected function convertLexicalToHtml(?string $lexicalJson): string
    {
        if ($lexicalJson === null || $lexicalJson === '') {
            return '';
        }

        $lexical = json_decode($lexicalJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Legacy HTML or plain text — return as-is.
            return $lexicalJson;
        }

        if (!isset($lexical['root']['children']) || !is_array($lexical['root']['children'])) {
            error_log(static::class . ': Invalid Lexical structure, missing root.children');
            return $lexicalJson;
        }

        try {
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node);
            }
            return $html;
        } catch (\Throwable $e) {
            error_log(static::class . ': Failed to convert Lexical to HTML: ' . $e->getMessage());
            return $lexicalJson;
        }
    }

    private function convertLexicalNodeToHtml(array $node): string
    {
        $type = $node['type'] ?? '';

        switch ($type) {
            case 'paragraph':
                $content = $this->convertLexicalChildren($node);
                $format = $node['format'] ?? '';
                if ($format === 'center') {
                    return "<p style=\"text-align: center;\">$content</p>\n";
                }
                return '<p>' . $content . "</p>\n";

            case 'heading':
                $tag = $node['tag'] ?? 'h2';
                // Whitelist heading tags to prevent injection
                $allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                if (!in_array($tag, $allowedTags, true)) {
                    $tag = 'h2';
                }
                return "<$tag>" . $this->convertLexicalChildren($node) . "</$tag>\n";

            case 'list':
                $listType = $node['listType'] ?? 'bullet';
                $tag = $listType === 'number' ? 'ol' : 'ul';
                return "<$tag>" . $this->convertLexicalChildren($node) . "</$tag>\n";

            case 'listitem':
                return '<li>' . $this->convertLexicalChildren($node) . "</li>\n";

            case 'link':
                $rawUrl = $node['url'] ?? ($node['fields']['url'] ?? '');
                $url = $this->isSafeLexicalUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                return "<a href=\"$url\">" . $this->convertLexicalChildren($node) . '</a>';

            case 'linebreak':
                return "<br>\n";

            case 'text':
                $text = $node['text'] ?? '';
                $format = (int)($node['format'] ?? 0);

                // Escape text content to prevent XSS
                $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');

                if ($format & self::$LEXICAL_FORMAT_BOLD) {
                    $text = "<strong>$text</strong>";
                }
                if ($format & self::$LEXICAL_FORMAT_ITALIC) {
                    $text = "<em>$text</em>";
                }
                if ($format & self::$LEXICAL_FORMAT_UNDERLINE) {
                    $text = "<u>$text</u>";
                }

                return $text;

            default:
                return $this->convertLexicalChildren($node);
        }
    }

    private function convertLexicalChildren(array $node): string
    {
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
     * Only allow http(s), relative paths, and anchors. Prevents javascript:
     * and data: URLs from sneaking through user-authored Lexical links.
     */
    private function isSafeLexicalUrl(string $url): bool
    {
        if ($url === '') {
            return false;
        }
        if ($url[0] === '/' || $url[0] === '#') {
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
