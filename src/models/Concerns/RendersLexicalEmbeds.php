<?php

namespace YNotRadio\Models\Concerns;

/**
 * Renders Payload Lexical "embed" blocks (the EmbedFeature block) to HTML
 * iframes for the legacy PHP front end.
 *
 * Shared by every Postgres read model that converts Lexical content so media
 * embeds render the same way regardless of which collection the content lives
 * in. The provider rules here must stay in sync with the TypeScript editor
 * side in `payload/src/features/embed/utils.ts`.
 */
trait RendersLexicalEmbeds
{
    /**
     * Render an embed block's fields (url, caption) to HTML. Returns '' when
     * the block has no usable, safe URL.
     *
     * @param array $fields The Lexical block node's `fields` payload.
     */
    protected function renderLexicalEmbedBlock(array $fields): string
    {
        $url = is_string($fields['url'] ?? null) ? trim($fields['url']) : '';
        if ($url === '' || !$this->isSafeEmbedUrl($url)) {
            return '';
        }

        $embed = $this->normalizeEmbedUrl($url);
        $src = htmlspecialchars($embed['src'], ENT_QUOTES, 'UTF-8');

        if ($embed['layout'] === 'video') {
            // Responsive 16:9 wrapper so videos scale with the column width.
            $iframe = '<div class="embed embed--video" '
                . 'style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">'
                . "<iframe src=\"{$src}\" "
                . 'style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" '
                . 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; '
                . 'picture-in-picture; web-share" allowfullscreen></iframe></div>';
        } else {
            // Audio players have a fixed height; full-width keeps them tidy.
            $height = (int) $embed['height'];
            $cls = 'embed embed--' . $embed['provider'];
            $iframe = "<iframe class=\"{$cls}\" width=\"100%\" height=\"{$height}\" src=\"{$src}\" "
                . 'frameborder="0" allow="encrypted-media; fullscreen; autoplay" '
                . 'scrolling="no"></iframe>';
        }

        $caption = '';
        if (!empty($fields['caption']) && is_string($fields['caption'])) {
            $caption = '<p class="embed-caption">'
                . htmlspecialchars($fields['caption'], ENT_QUOTES, 'UTF-8') . '</p>';
        }

        return "\n" . $iframe . $caption . "\n";
    }

    /**
     * Map any supported media URL to an iframe-ready src plus layout hints.
     * Mirror of `detectEmbedType()` in payload/src/features/embed/utils.ts.
     *
     * @return array{provider:string, src:string, layout:string, height:int}
     */
    protected function normalizeEmbedUrl(string $url): array
    {
        // YouTube -> /embed/<id>
        if (str_contains($url, 'youtube.com') || str_contains($url, 'youtu.be')) {
            $id = $this->extractYouTubeId($url);
            if ($id !== null) {
                return [
                    'provider' => 'youtube',
                    'src' => "https://www.youtube.com/embed/{$id}",
                    'layout' => 'video',
                    'height' => 0,
                ];
            }
        }

        // Vimeo -> player.vimeo.com/video/<id>
        if (str_contains($url, 'vimeo.com') && preg_match('#vimeo\.com/(?:video/)?(\d+)#', $url, $m)) {
            return [
                'provider' => 'vimeo',
                'src' => "https://player.vimeo.com/video/{$m[1]}",
                'layout' => 'video',
                'height' => 0,
            ];
        }

        // Mixcloud -> player widget (the dominant provider in legacy custom text)
        if (str_contains($url, 'mixcloud.com')) {
            if (str_contains($url, 'player-widget.mixcloud.com')) {
                // Already a widget embed URL — use as-is.
                // The mini player (mini=1) renders at 60 px; the full widget at 120 px.
                $height = $this->isMixcloudMiniPlayer($url) ? 60 : 120;
                return ['provider' => 'mixcloud', 'src' => $url, 'layout' => 'audio', 'height' => $height];
            }
            $feed = $this->extractMixcloudFeed($url);
            if ($feed !== null) {
                $src = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed='
                    . rawurlencode($feed);
                return ['provider' => 'mixcloud', 'src' => $src, 'layout' => 'audio', 'height' => 120];
            }
            // Genre/discover/hub URLs aren't single feeds; fall through to generic.
        }

        // OpenDrive -> the /player/<id> URL is already an embeddable audio bar.
        if (str_contains($url, 'opendrive.com')) {
            return ['provider' => 'opendrive', 'src' => $url, 'layout' => 'audio', 'height' => 60];
        }

        // Spotify -> open.spotify.com/embed/<type>/<id>
        if (
            str_contains($url, 'spotify.com')
            && preg_match('#spotify\.com/(track|album|playlist|artist|episode|show)/([a-zA-Z0-9]+)#', $url, $m)
        ) {
            return [
                'provider' => 'spotify',
                'src' => "https://open.spotify.com/embed/{$m[1]}/{$m[2]}",
                'layout' => 'audio',
                'height' => 152,
            ];
        }

        // SoundCloud -> player wrapper around the original URL
        if (str_contains($url, 'soundcloud.com')) {
            return [
                'provider' => 'soundcloud',
                'src' => 'https://w.soundcloud.com/player/?url=' . rawurlencode($url),
                'layout' => 'audio',
                'height' => 120,
            ];
        }

        // Generic — embed the URL as-is (matches the block's "any iframe URL").
        return ['provider' => 'generic', 'src' => $url, 'layout' => 'audio', 'height' => 152];
    }

    protected function extractYouTubeId(string $url): ?string
    {
        $patterns = [
            '#(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})#',
            '#youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})#',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $m)) {
                return $m[1];
            }
        }
        return null;
    }

    /**
     * Pull a Mixcloud feed path (e.g. `/ynotradio/some-show/`) from a public
     * mixcloud.com show URL. Genre/discover/search hub pages aren't single
     * feeds, so return null and let the caller fall back to a generic embed.
     */
    protected function extractMixcloudFeed(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (!is_string($path) || trim($path, '/') === '') {
            return null;
        }

        $trimmed = trim($path, '/');
        $segments = explode('/', $trimmed);
        $hubs = ['genres', 'discover', 'categories', 'tag', 'search', 'upload', 'live'];

        if (count($segments) < 2 || in_array($segments[0], $hubs, true)) {
            return null;
        }

        // Mixcloud feeds are addressed with a leading and trailing slash.
        return '/' . $trimmed . '/';
    }

    /**
     * Return true when a Mixcloud widget URL requests the mini player layout
     * (i.e. it contains the `mini=1` query parameter).
     */
    protected function isMixcloudMiniPlayer(string $url): bool
    {
        $query = parse_url($url, PHP_URL_QUERY) ?? '';
        parse_str($query, $params);
        return ($params['mini'] ?? null) === '1';
    }

    protected function isSafeEmbedUrl(string $url): bool
    {
        $parsed = parse_url($url);
        if ($parsed === false || !isset($parsed['scheme'])) {
            return false;
        }
        $scheme = strtolower($parsed['scheme']);
        return $scheme === 'http' || $scheme === 'https';
    }
}
