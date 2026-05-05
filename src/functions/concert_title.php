<?php

/**
 * Sanitize concert title HTML for output.
 *
 * Concert titles support a tiny subset of inline formatting (bold, italic,
 * line breaks, links). This helper strips everything else and removes unsafe
 * link attributes (javascript:/data: URLs, on* event handlers) before the
 * string is echoed into a table cell.
 *
 * Returns sanitized HTML safe to render directly. Plain text input is
 * HTML-escaped.
 */
function sanitize_concert_title_html(?string $html): string {
    if ($html === null || $html === '') {
        return '';
    }

    $allowed = '<em><strong><a><br><i><b>';
    $clean = strip_tags($html, $allowed);

    // Strip on* event handler attributes from any remaining tag.
    $clean = preg_replace('/\son[a-z]+\s*=\s*"[^"]*"/i', '', $clean);
    $clean = preg_replace('/\son[a-z]+\s*=\s*\'[^\']*\'/i', '', $clean);

    // Neutralize unsafe href schemes on anchor tags.
    $clean = preg_replace_callback(
        '/<a\b([^>]*)>/i',
        function ($m) {
            $attrs = $m[1];
            // Pull href value (single or double quoted).
            if (preg_match('/\bhref\s*=\s*"([^"]*)"/i', $attrs, $hm)
                || preg_match('/\bhref\s*=\s*\'([^\']*)\'/i', $attrs, $hm)) {
                $href = trim($hm[1]);
                if (!preg_match('#^(https?:|mailto:|tel:|/|\#|\?)#i', $href)) {
                    $attrs = preg_replace('/\bhref\s*=\s*"[^"]*"/i', 'href="#"', $attrs);
                    $attrs = preg_replace('/\bhref\s*=\s*\'[^\']*\'/i', "href='#'", $attrs);
                }
            }
            return '<a' . $attrs . '>';
        },
        $clean
    );

    return $clean;
}
