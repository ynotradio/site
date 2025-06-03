<?php
// Helper functions for displaying music entries, maintained for compatibility
// These could be integrated into templates in a future update

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
        echo "<dt>New Music Week of ". $date . "</dt>";
        foreach ($entries as $music_info) {
            echo "<dd>";
            if ($music_info['url']) {
                echo $music_info['artist'] . " - <a href=\"" . $music_info['url']. "\" target=_new> ". $music_info['song'] ." </a>";
            } else {
                echo $music_info['artist'] . " - " . $music_info['song'];
            }
            echo "</dd>";
        }
    }
    echo "</dl>";
}
