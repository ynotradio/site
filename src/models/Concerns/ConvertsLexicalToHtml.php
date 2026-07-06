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
    use RendersLexicalEmbeds;
    use RendersPayPalButton;
    use RendersPayPalSmartButtons;

    // Lexical text format bit flags
    private static int $LEXICAL_FORMAT_BOLD = 1;
    private static int $LEXICAL_FORMAT_ITALIC = 2;
    private static int $LEXICAL_FORMAT_UNDERLINE = 8;

    /**
     * Convert a Lexical JSON string to HTML. If the input isn't valid JSON or
     * doesn't have the expected structure, the original string is returned
     * untouched (treated as already-HTML legacy content).
     */
    protected function convertLexicalToHtml(?string $lexicalJson, bool $forceNewTabLinks = false): string
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
            $mediaMap = $this->resolveLexicalMediaMap($lexical['root']['children']);
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node, $forceNewTabLinks, $mediaMap);
            }
            return $html;
        } catch (\Throwable $e) {
            error_log(static::class . ': Failed to convert Lexical to HTML: ' . $e->getMessage());
            return $lexicalJson;
        }
    }

    /**
     * Batch-resolve every `upload` node's Media id to its row (url, alt) in one
     * query, so image rendering doesn't need a query per image. Returns an
     * empty map (no query at all) when the content has no upload nodes, or
     * when the host class doesn't expose a PDO `$db` (e.g. test harnesses).
     *
     * @param array $nodes Top-level Lexical child nodes
     * @return array<int, array{url: ?string, alt: ?string}>
     */
    private function resolveLexicalMediaMap(array $nodes): array
    {
        $ids = [];
        $this->collectLexicalUploadIds($nodes, $ids);

        if ($ids === [] || !isset($this->db) || !($this->db instanceof \PDO)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare("SELECT id, url, alt FROM media WHERE id IN ($placeholders)");
        $stmt->execute(array_values($ids));

        $map = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $map[(int)$row['id']] = ['url' => $row['url'] ?? null, 'alt' => $row['alt'] ?? null];
        }
        return $map;
    }

    private function collectLexicalUploadIds(array $nodes, array &$ids): void
    {
        foreach ($nodes as $node) {
            if (($node['type'] ?? '') === 'upload') {
                $value = $node['value'] ?? null;
                $id = is_array($value) ? ($value['id'] ?? null) : $value;
                if (is_numeric($id)) {
                    $ids[(int)$id] = (int)$id;
                }
            }
            if (isset($node['children']) && is_array($node['children'])) {
                $this->collectLexicalUploadIds($node['children'], $ids);
            }
        }
    }

    private function convertLexicalNodeToHtml(array $node, bool $forceNewTabLinks, array $mediaMap = []): string
    {
        $type = $node['type'] ?? '';

        switch ($type) {
            case 'paragraph':
                $content = $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap);

                // Older custom-text imports flattened tabular data into a
                // "[Table]\nrow1col1 | row1col2\n..." text marker instead of a
                // real Lexical table (see enhancedHtmlToLexical.ts). Keep
                // rendering that convention as a real <table> for already-
                // migrated content even as new content uses real table nodes.
                if (strncmp($content, '[Table]', 7) === 0) {
                    return $this->convertLegacyTableMarkupToHtml($content);
                }

                $format = $node['format'] ?? '';
                return $this->wrapInBlock('p', $content, $format);

            case 'heading':
                $tag = $node['tag'] ?? 'h2';
                // Whitelist heading tags to prevent injection
                $allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                if (!in_array($tag, $allowedTags, true)) {
                    $tag = 'h2';
                }
                return "<$tag>" . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</$tag>\n";

            case 'list':
                $listType = $node['listType'] ?? 'bullet';
                $tag = $listType === 'number' ? 'ol' : 'ul';
                return "<$tag>" . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</$tag>\n";

            case 'listitem':
                return '<li>' . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</li>\n";

            case 'link':
                $rawUrl = $node['url'] ?? ($node['fields']['url'] ?? '');
                $url = $this->isSafeLexicalUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                $fields = is_array($node['fields'] ?? null) ? $node['fields'] : [];
                $newTab = $forceNewTabLinks || (bool)($fields['newTab'] ?? false);
                $target = $newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
                return "<a href=\"$url\"$target>" . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . '</a>';

            case 'linebreak':
                return "<br>\n";

            case 'horizontalrule':
                return "<hr>\n";

            case 'quote':
                return '<blockquote>' . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</blockquote>\n";

            case 'table':
                // .table for the base cell padding/border/header styling, plus
                // .table-striped to recreate the alternating-row shading the
                // legacy HTML did with manual bgcolor attributes (intentionally
                // not preserved by the migration) without reintroducing inline
                // presentational markup.
                return '<table class="table table-striped">' . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</table>\n";

            case 'tablerow':
                return '<tr>' . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</tr>\n";

            case 'tablecell':
                $cellTag = !empty($node['headerState']) ? 'th' : 'td';
                return "<$cellTag>" . $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap) . "</$cellTag>";

            case 'upload':
                return $this->renderLexicalUploadNode($node, $mediaMap);

            case 'block':
                // Payload block nodes — dispatch by blockType since more than
                // one BlocksFeature block can appear in the same field.
                $fields = is_array($node['fields'] ?? null) ? $node['fields'] : [];
                if (($fields['blockType'] ?? '') === 'paypalButton') {
                    return $this->renderLexicalPayPalButtonBlock($fields);
                }
                if (($fields['blockType'] ?? '') === 'paypalSmartButtons') {
                    return $this->renderLexicalPayPalSmartButtonsBlock($fields);
                }
                return $this->renderLexicalEmbedBlock($fields);

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

                // TextStateFeature's node-state key ('$', see Lexical core's
                // NODE_STATE_KEY) — only the semantic "small" fontSize state
                // is wired up today (payload/src/features/text-size), the
                // modern replacement for legacy <font size> small print.
                $textState = is_array($node['$'] ?? null) ? $node['$'] : [];
                if (($textState['fontSize'] ?? null) === 'small') {
                    $text = '<span class="lexical-text--small">' . $text . '</span>';
                }

                return $text;

            default:
                return $this->convertLexicalChildren($node, $forceNewTabLinks, $mediaMap);
        }
    }

    private function convertLexicalChildren(array $node, bool $forceNewTabLinks, array $mediaMap = []): string
    {
        if (!isset($node['children']) || !is_array($node['children'])) {
            return '';
        }

        $html = '';
        foreach ($node['children'] as $child) {
            $html .= $this->convertLexicalNodeToHtml($child, $forceNewTabLinks, $mediaMap);
        }

        return $html;
    }

    /**
     * Render an `upload` node as an <img>, looking up the Media row that
     * resolveLexicalMediaMap() already batch-fetched. Renders nothing if the
     * referenced Media id has no matching row or no url (e.g. deleted media).
     *
     * @param array<int, array{url: ?string, alt: ?string}> $mediaMap
     */
    private function renderLexicalUploadNode(array $node, array $mediaMap): string
    {
        $value = $node['value'] ?? null;
        $id = is_array($value) ? ($value['id'] ?? null) : $value;
        if (!is_numeric($id) || !isset($mediaMap[(int)$id]['url'])) {
            return '';
        }

        $url = $mediaMap[(int)$id]['url'];
        if (!is_string($url) || $url === '') {
            return '';
        }

        $fields = is_array($node['fields'] ?? null) ? $node['fields'] : [];
        $alignment = is_string($fields['alignment'] ?? null) ? $fields['alignment'] : '';
        $class = 'lexical-image';
        if (in_array($alignment, ['left', 'right', 'center'], true)) {
            $class .= " lexical-image--{$alignment}";
        }

        $alt = htmlspecialchars((string)($mediaMap[(int)$id]['alt'] ?? ''), ENT_QUOTES, 'UTF-8');
        $src = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        return "<img class=\"{$class}\" src=\"{$src}\" alt=\"{$alt}\" loading=\"lazy\">\n";
    }

    /**
     * Render the legacy "[Table]\nheader1 | header2\nrow1col1 | row1col2..."
     * text marker (emitted for tabular content before real Lexical table
     * nodes existed) as an HTML table, matching the original MySQL styling.
     */
    private function convertLegacyTableMarkupToHtml(string $content): string
    {
        $content = trim(substr($content, 7));
        $lines = preg_split('/\s{2,}|\n/', $content);
        if (empty($lines)) {
            return '';
        }

        $html = '<table width="100%" cellspacing="0" cellpadding="0">' . "\n";
        $html .= '  <colgroup><col width="33%" span="3"></colgroup>' . "\n";
        $html .= '  <tbody>' . "\n";

        $headers = array_map('trim', explode('|', array_shift($lines)));
        $html .= '  <tr>' . "\n";
        foreach ($headers as $header) {
            $escaped = htmlspecialchars($header, ENT_QUOTES, 'UTF-8');
            $html .= '    <td width="33%" bgcolor="#000000"><font color="#FFFFFF"><strong>'
                . $escaped . '</strong></font></td>' . "\n";
        }
        $html .= '  </tr>' . "\n";

        $rowIndex = 0;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $cells = array_map('trim', explode('|', $line));
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

    /**
     * Wrap text content in a block element (p, h1-h6) with optional text alignment.
     *
     * @param string $tag HTML tag name (p, h1-h6)
     * @param string $content HTML content
     * @param string $format Optional text alignment (left, center, right, justify)
     * @return string Formatted HTML block element
     */
    private function wrapInBlock(string $tag, string $content, string $format = ''): string
    {
        $style = '';
        if ($format && in_array($format, ['left', 'center', 'right', 'justify'], true)) {
            $style = " style=\"text-align: {$format};\"";
        }

        // Empty paragraph blocks (Lexical produces these when an editor presses
        // Enter on a blank line) are typically collapsed to zero-height by
        // browsers / our CSS, so a content editor pressing Enter to create
        // visual spacing sees no effect. Emit <p><br></p> for empty <p> blocks
        // so blank lines render as actual blank lines, matching the WYSIWYG
        // behavior content editors expect from TinyMCE / CKEditor.
        if ($tag === 'p' && trim($content) === '') {
            return "<{$tag}{$style}><br></{$tag}>\n";
        }

        return "<{$tag}{$style}>{$content}</{$tag}>\n";
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
