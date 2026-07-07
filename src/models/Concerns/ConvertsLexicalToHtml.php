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
            return $this->normalizeLegacyHtmlArtifacts($html);
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
     * Legacy MySQL story content was raw HTML, and content migrated from it
     * (or still pasted in that style) carries HTML that Lexical has no node
     * for — comments, `<font size>` small print, and formatting tags left
     * broken by the original importer's best-effort parser. Since Lexical
     * has no comment/font-size/tag-repair concept, all of this survives as
     * literal text and gets `htmlspecialchars`-escaped in convertLexicalToHtml,
     * showing up as visible garbage instead of the hidden/formatted content
     * an author intended. Clean up each pattern on the final assembled HTML,
     * where escaped markup from every text node sits side by side regardless
     * of which Lexical node it originated in.
     */
    private function normalizeLegacyHtmlArtifacts(string $html): string
    {
        $html = $this->stripLegacyHtmlComments($html);
        $html = $this->normalizeNbsp($html);
        $html = $this->recoverLegacyHorizontalRules($html);
        $html = $this->recoverLegacyFormattingTags($html);
        return $html;
    }

    /**
     * DJs carried the habit of hiding stale copy inside `<!-- -->` from the
     * old raw-HTML story editor, where the browser rendered actual HTML
     * comments as invisible. Lexical has no comment node, so that markup is
     * now typed as literal text and escaped to `&lt;!--...--&gt;`, showing up
     * as visible garbage on the front end. Strip escaped comment spans from
     * the assembled HTML so this old habit still hides content as authors
     * expect.
     */
    private function stripLegacyHtmlComments(string $html): string
    {
        return preg_replace('/&lt;!--.*?--&gt;/s', '', $html) ?? $html;
    }

    /**
     * Non-breaking spaces pasted from Word/Google Docs are invisible in the
     * editor, so nobody notices them until one lands mid-word on a narrow
     * viewport and blocks a wrap that should happen there. A regular space
     * lets the browser wrap wherever it actually needs to.
     */
    private function normalizeNbsp(string $html): string
    {
        return str_replace(["\u{00a0}", '&amp;nbsp;', '&nbsp;'], ' ', $html);
    }

    /**
     * A literal `<hr />`/`<hr>` in escaped text (e.g. old dividers between a
     * CD-of-the-week review's byline and body) has a direct Lexical
     * equivalent (the `horizontalrule` node already renders real `<hr>`), so
     * unlike the tag-pair recovery below there's no ambiguity to resolve —
     * just convert it.
     */
    private function recoverLegacyHorizontalRules(string $html): string
    {
        return preg_replace('/&lt;hr\s*\/?&gt;/i', '<hr>', $html) ?? $html;
    }

    /**
     * Legacy formatting tags (`<b>`, `<strong>`, `<i>`, `<em>`, `<u>`,
     * `<font size="N">`) that survived migration as literal escaped text
     * are consistently split across sibling Lexical text nodes — sometimes
     * even across paragraph boundaries — because the original importer gave
     * up at exactly the point the legacy HTML's tags stopped nesting
     * cleanly. There's no reliable position-only heuristic for a lone open
     * or close tag (e.g. `</b>Shana</b>` — bold could plausibly start before
     * or after "Shana"; a stray `</font>` with no open anywhere nearby, seen
     * in real migrated content, would otherwise produce an orphaned closing
     * span), so this only recovers a tag pair that both find a real match
     * somewhere in the document via a stack scan; anything left unmatched
     * is dropped rather than guessed, leaving the surrounding text plain.
     *
     * `<font size="N">` maps to a `lexical-text--*` size class matching the
     * legacy site's real usage of the browser's built-in 1-7 HTML font-size
     * scale (1=smallest subtitle .. 5=large DJ-name heading — this site
     * never used 6/7), rather than one flat "small" treatment. size=3 is
     * the browser default, so it's left unwrapped.
     */
    private const LEGACY_FONT_SIZE_CLASSES = [
        '1' => 'lexical-text--tiny',
        '2' => 'lexical-text--small',
        '4' => 'lexical-text--large',
        '5' => 'lexical-text--xlarge',
    ];

    private function recoverLegacyFormattingTags(string $html): string
    {
        $simpleTags = ['b' => 'strong', 'strong' => 'strong', 'i' => 'em', 'em' => 'em', 'u' => 'u'];
        $pattern = '/&lt;(\/?)\s*(?:(b|strong|i|em|u)|font\s+size=(?:&quot;|&#0?39;)?([1-5])(?:&quot;|&#0?39;)?\s*|(\/font))\s*&gt;/i';

        if (!preg_match_all($pattern, $html, $matches, PREG_OFFSET_CAPTURE)) {
            return $html;
        }

        $stack = [];
        $toDelete = [];
        $replacements = [];

        foreach ($matches[0] as $i => $fullMatch) {
            $simpleTag = $matches[2][$i][0] !== '' ? strtolower($matches[2][$i][0]) : null;
            $fontSize = $matches[3][$i][0] !== '' ? $matches[3][$i][0] : null;
            $isFontClose = $matches[4][$i][0] !== '';
            $offset = $fullMatch[1];
            $length = strlen($fullMatch[0]);

            if ($simpleTag !== null) {
                $isClosing = $matches[1][$i][0] !== '';
                $tag = $simpleTags[$simpleTag];
                $openHtml = "<$tag>";
                $closeHtml = "</$tag>";
            } elseif ($fontSize !== null) {
                // size=3 is the browser default — no wrapper needed, but the
                // tag still needs tracking so its matching </font> is
                // recognized and dropped rather than left as an orphan.
                $isClosing = false;
                $tag = 'font';
                $class = self::LEGACY_FONT_SIZE_CLASSES[$fontSize] ?? null;
                $openHtml = $class !== null ? "<span class=\"$class\">" : '';
                $closeHtml = $class !== null ? '</span>' : '';
            } else {
                // Closing </font> — its rendered HTML comes from the
                // matched open's stored 'closeHtml' below, not from here.
                $isClosing = $isFontClose;
                $tag = 'font';
            }

            if (!$isClosing) {
                $stack[] = [
                    'tag' => $tag,
                    'offset' => $offset,
                    'length' => $length,
                    'html' => $openHtml,
                    'closeHtml' => $closeHtml,
                ];
                continue;
            }

            $openIndex = null;
            for ($j = count($stack) - 1; $j >= 0; $j--) {
                if ($stack[$j]['tag'] === $tag) {
                    $openIndex = $j;
                    break;
                }
            }

            if ($openIndex === null) {
                // Stray close with no matching open anywhere before it.
                $toDelete[] = ['offset' => $offset, 'length' => $length];
                continue;
            }

            $popped = array_splice($stack, $openIndex);
            $open = array_shift($popped);
            foreach ($popped as $unmatchedOpen) {
                $toDelete[] = ['offset' => $unmatchedOpen['offset'], 'length' => $unmatchedOpen['length']];
            }
            $replacements[] = ['offset' => $open['offset'], 'length' => $open['length'], 'html' => $open['html']];
            $replacements[] = ['offset' => $offset, 'length' => $length, 'html' => $open['closeHtml']];
        }

        // Anything still on the stack never found a close — drop it too.
        foreach ($stack as $unmatched) {
            $toDelete[] = ['offset' => $unmatched['offset'], 'length' => $unmatched['length']];
        }

        $edits = array_merge(
            $replacements,
            array_map(fn ($d) => ['offset' => $d['offset'], 'length' => $d['length'], 'html' => ''], $toDelete),
        );

        usort($edits, fn ($a, $b) => $b['offset'] <=> $a['offset']);
        foreach ($edits as $edit) {
            $html = substr_replace($html, $edit['html'], $edit['offset'], $edit['length']);
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
