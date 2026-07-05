<?php
/**
 * Shared Live365 "now playing" data fetch.
 * Returns ['currentTrack' => [...], 'lastPlayed' => [...], 'available' => bool].
 *
 * Cached in a static so multiple includes per request only hit the API once.
 */

if (!function_exists('ynot_get_now_playing')) {
    function ynot_get_now_playing()
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $jsonData = @file_get_contents('https://api.live365.com/station/a54553');
        $data = ($jsonData !== false) ? json_decode($jsonData, true) : null;

        if ($data === null) {
            $cache = [
                'available' => false,
                'currentTrack' => ['artist' => '', 'title' => 'Y-Not Radio', 'art' => '', 'altText' => 'Y-Not Radio'],
                'lastPlayed' => [],
            ];
            return $cache;
        }

        $currentTrack = $data['current-track'] ?? ['artist' => '', 'title' => 'Y-Not Radio', 'art' => ''];
        $artist = $currentTrack['artist'] ?? '';
        $title = $currentTrack['title'] ?? 'Y-Not Radio';
        $currentTrack['altText'] = $artist ? "Album art for $artist - $title" : 'Y-Not Radio';

        $cache = [
            'available' => true,
            'currentTrack' => $currentTrack,
            'lastPlayed' => $data['last-played'] ?? [],
        ];
        return $cache;
    }
}
