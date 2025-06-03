<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\OnDemand;
use mysqli;

class SqlOnDemand implements OnDemand {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM ondemand WHERE id = $id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching on demand entry by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(string $sort = 'date', int $page = 1, int $limit = 5): array {
        if ($sort === 'text') {
            return $this->getAllTextList();
        }
        
        // Calculate the starting position for pagination
        $start = ($page - 1) * $limit;

        // Get data
        if ($sort === 'date') {
            $query = "SELECT DATE_FORMAT(date, '%m/%d/%y') as fdate, id, image, headline, note, songs, audio_url FROM ondemand 
                      WHERE deleted = 'no' ORDER BY date DESC LIMIT $start, $limit";
        } else {
            $query = "SELECT DATE_FORMAT(date, '%m/%d/%y') as fdate, id, image, headline, note, songs, audio_url FROM ondemand 
                      WHERE deleted = 'no' ORDER BY headline LIMIT $start, $limit";
        }

        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching on demand entries: " . mysqli_error($this->db));
        }

        $entries = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $entries[] = $row;
        }
        
        return $entries;
    }

    private function getAllTextList(): array {
        $query = "SELECT DATE_FORMAT(date, '%m/%d/%y') as fdate, id, headline FROM ondemand 
                  WHERE deleted = 'no' ORDER BY headline, date DESC";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching text list of on demand entries: " . mysqli_error($this->db));
        }

        $entries = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $entries[] = $row;
        }
        
        return $entries;
    }

    public function getTotalCount(): int {
        $query = "SELECT COUNT(*) as num FROM ondemand WHERE deleted = 'no'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error counting on demand entries: " . mysqli_error($this->db));
        }

        $row = mysqli_fetch_array($result);
        return (int)$row['num'];
    }

    public function add(array $data): int {
        $requiredFields = ['date', 'image', 'headline', 'note', 'songs', 'audio_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $date = mysqli_real_escape_string($this->db, $data['date']);
        $image = mysqli_real_escape_string($this->db, $data['image']);
        $headline = mysqli_real_escape_string($this->db, $data['headline']);
        $note = mysqli_real_escape_string($this->db, $data['note']);
        $songs = mysqli_real_escape_string($this->db, $data['songs']);
        $audio_id = mysqli_real_escape_string($this->db, $data['audio_id']);

        $query = "INSERT INTO ondemand VALUES (id, '$date', '$image', '$headline', '$note', '$songs', '$audio_id', 'opendrive', 'no')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding on demand entry: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['date', 'image', 'headline', 'note', 'songs', 'audio_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $date = mysqli_real_escape_string($this->db, $data['date']);
        $image = mysqli_real_escape_string($this->db, $data['image']);
        $headline = mysqli_real_escape_string($this->db, $data['headline']);
        $note = mysqli_real_escape_string($this->db, $data['note']);
        $songs = mysqli_real_escape_string($this->db, $data['songs']);
        $audio_id = mysqli_real_escape_string($this->db, $data['audio_id']);

        $query = "UPDATE ondemand SET 
                 date = '$date',
                 image = '$image',
                 headline = '$headline',
                 note = '$note',
                 songs = '$songs',
                 audio_url = '$audio_id'
                 WHERE id = $id";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update on demand entry: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE ondemand SET deleted = 'yes' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to delete on demand entry: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function getAllForAdmin(): array {
        $query = "SELECT * FROM ondemand WHERE deleted = 'no' ORDER BY date DESC";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching on demand entries for admin: " . mysqli_error($this->db));
        }

        $entries = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $entries[] = $row;
        }
        
        return $entries;
    }
}
