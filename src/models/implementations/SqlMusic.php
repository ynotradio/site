<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Music;
use mysqli;

class SqlMusic implements Music {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM music WHERE id = $id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching music by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(): array {
        $query = "SELECT * FROM music WHERE deleted = 'n' AND date > DATE_SUB(now(), INTERVAL 6 MONTH) ORDER BY date DESC, artist";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching music: " . mysqli_error($this->db));
        }

        $music = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $music[] = $row;
        }
        
        return $music;
    }

    public function getAllGroupedByDate(): array {
        $date_query = "SELECT date FROM music WHERE deleted = 'n' AND date > CURDATE() - INTERVAL 6 MONTH GROUP BY date ORDER BY date DESC";
        $date_result = mysqli_query($this->db, $date_query);

        if (!$date_result) {
            throw new \RuntimeException("Error fetching music dates: " . mysqli_error($this->db));
        }

        $music_query = "SELECT * FROM music WHERE deleted = 'n' ORDER BY date DESC, artist";
        $music_result = mysqli_query($this->db, $music_query);

        if (!$music_result) {
            throw new \RuntimeException("Error fetching music entries: " . mysqli_error($this->db));
        }

        $grouped_music = [];
        while ($date_info = mysqli_fetch_assoc($date_result)) {
            $date = $date_info['date'];
            $entries = [];
            
            mysqli_data_seek($music_result, 0);
            while ($music_info = mysqli_fetch_assoc($music_result)) {
                if ($music_info['date'] == $date) {
                    $entries[] = $music_info;
                }
            }
            
            $grouped_music[$date] = $entries;
        }
        
        return $grouped_music;
    }

    public function add(array $data): int {
        $requiredFields = ['date', 'artist', 'song'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $date = mysqli_real_escape_string($this->db, $data['date']);
        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $song = mysqli_real_escape_string($this->db, $data['song']);
        $url = isset($data['url']) ? mysqli_real_escape_string($this->db, $data['url']) : '';

        $query = "INSERT INTO music VALUES (id, '$artist', '$song', '$url', '$date', 'n')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding music: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['date', 'artist', 'song'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $date = mysqli_real_escape_string($this->db, $data['date']);
        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $song = mysqli_real_escape_string($this->db, $data['song']);
        $url = isset($data['url']) ? mysqli_real_escape_string($this->db, $data['url']) : '';

        $query = "UPDATE music SET 
                 date = '$date',
                 artist = '$artist',
                 song = '$song',
                 url = '$url'
                 WHERE id = $id";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update music: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE music SET deleted = 'y' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to delete music: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }
}
