<?php
// Helper functions for displaying music entries, maintained for compatibility
// These could be integrated into templates in a future update

/**
 * Convert an ISO date string (YYYY-MM-DD) to a human-readable format (e.g. "April 20th, 2026").
 *
 * @param string $iso_date Date string in YYYY-MM-DD format
 * @return string Human-readable date, or the original string if parsing fails
 */
function humanize_date(string $iso_date): string {
    $dt = DateTimeImmutable::createFromFormat('Y-m-d', $iso_date);
    if ($dt === false) {
        return $iso_date;
    }
    $day = (int) $dt->format('j');
    $suffix = match (true) {
        $day >= 11 && $day <= 13 => 'th',
        $day % 10 === 1           => 'st',
        $day % 10 === 2           => 'nd',
        $day % 10 === 3           => 'rd',
        default                   => 'th',
    };
    return $dt->format('F ') . $day . $suffix . $dt->format(', Y');
}

function display_music($music) {
    echo "<br><b>Date:</b> ". $music['date'].
    "<br><b>Artist:</b> ". $music['artist'].
    "<br><b>Song:</b> ". $music['song'].
    '<br><b>Song URL:</b> <a href="'. $music['url'] . '" target="_blank">'.$music['url'] .'</a> ';
}

function display_all_music() {
    global $musicModel;
    
    $grouped_music = $musicModel->getAllGroupedByDate();
    
    echo "<dl class=\"new_music\">";
    foreach ($grouped_music as $date => $entries) {
        echo "<dt>New Music Week of " . humanize_date($date) . "</dt>";
        foreach ($entries as $music_info) {
            echo "<dd>";
            if ($music_info['url']) {
                echo $music_info['artist'] . " &mdash; <a href=\"" . $music_info['url']. "\" target=\"_blank\" rel=\"noopener noreferrer\">" . $music_info['song'] . "</a>";
            } else {
                echo $music_info['artist'] . " &mdash; " . $music_info['song'];
            }
            echo "</dd>";
        }
    }
    echo "</dl>";
}
