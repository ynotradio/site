<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CdOfTheWeek;
use mysqli;

class SqlCdOfTheWeek implements CdOfTheWeek {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getCurrent(): ?array {
        $query = "SELECT * FROM cdotw WHERE deleted = 'no' ORDER BY date DESC LIMIT 1";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching current CD of the week: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM cdotw WHERE id = $id AND deleted = 'no'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching CD of the week by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(int $limit = 64): array {
        $limit = mysqli_real_escape_string($this->db, $limit);
        $query = "SELECT * FROM cdotw WHERE deleted = 'no' ORDER BY date DESC LIMIT $limit";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching all CDs of the week: " . mysqli_error($this->db));
        }

        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function add(array $data): int {
        $requiredFields = ['artist', 'title', 'label', 'review', 'cd_pic_url', 'band', 'reviewer', 'date'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $title = mysqli_real_escape_string($this->db, $data['title']);
        $label = mysqli_real_escape_string($this->db, $data['label']);
        $review = mysqli_real_escape_string($this->db, $data['review']);
        $cd_pic_url = mysqli_real_escape_string($this->db, $data['cd_pic_url']);
        $band = mysqli_real_escape_string($this->db, $data['band']);
        $reviewer = mysqli_real_escape_string($this->db, $data['reviewer']);
        $date = mysqli_real_escape_string($this->db, $data['date']);

        $query = "INSERT INTO cdotw (artist, title, label, review, cd_pic_url, band, reviewer, date, deleted) 
                 VALUES ('$artist', '$title', '$label', '$review', '$cd_pic_url', '$band', '$reviewer', '$date', 'no')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding CD of the week: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['artist', 'title', 'label', 'review', 'cd_pic_url', 'band', 'reviewer', 'date'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $title = mysqli_real_escape_string($this->db, $data['title']);
        $label = mysqli_real_escape_string($this->db, $data['label']);
        $review = mysqli_real_escape_string($this->db, $data['review']);
        $cd_pic_url = mysqli_real_escape_string($this->db, $data['cd_pic_url']);
        $band = mysqli_real_escape_string($this->db, $data['band']);
        $reviewer = mysqli_real_escape_string($this->db, $data['reviewer']);
        $date = mysqli_real_escape_string($this->db, $data['date']);

        $query = "UPDATE cdotw SET 
                 artist = '$artist',
                 title = '$title',
                 label = '$label',
                 review = '$review',
                 cd_pic_url = '$cd_pic_url',
                 band = '$band',
                 reviewer = '$reviewer',
                 date = '$date'
                 WHERE id = $id AND deleted = 'no'";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update CD of the week: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE cdotw SET deleted = 'yes' WHERE id = $id";
        return mysqli_query($this->db, $query);
    }
}