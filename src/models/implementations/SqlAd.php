<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Ad;
use mysqli;

class SqlAd implements Ad {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM ads WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error fetching Ad by ID: " . mysqli_error($this->db));
        }
        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(int $limit = 64): array {
        $limit = mysqli_real_escape_string($this->db, $limit);
        $query = "SELECT * FROM ads WHERE deleted = 'n' AND end_date >= now() ORDER BY priority LIMIT $limit";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error fetching all Ads: " . mysqli_error($this->db));
        }
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function add(array $data): int {
        $requiredFields = ['name', 'start_date', 'end_date', 'pic_url', 'web_url', 'priority'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }
        $name = mysqli_real_escape_string($this->db, $data['name']);
        $start_date = mysqli_real_escape_string($this->db, $data['start_date']);
        $end_date = mysqli_real_escape_string($this->db, $data['end_date']);
        $pic_url = mysqli_real_escape_string($this->db, $data['pic_url']);
        $web_url = mysqli_real_escape_string($this->db, $data['web_url']);
        $priority = mysqli_real_escape_string($this->db, $data['priority']);
        $query = "INSERT INTO ads (name, start_date, end_date, pic_url, web_url, priority, deleted) VALUES ('$name', '$start_date', '$end_date', '$pic_url', '$web_url', '$priority', 'n')";
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding Ad: " . mysqli_error($this->db));
        }
        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['name', 'start_date', 'end_date', 'pic_url', 'web_url', 'priority'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }
        $id = mysqli_real_escape_string($this->db, $id);
        $name = mysqli_real_escape_string($this->db, $data['name']);
        $start_date = mysqli_real_escape_string($this->db, $data['start_date']);
        $end_date = mysqli_real_escape_string($this->db, $data['end_date']);
        $pic_url = mysqli_real_escape_string($this->db, $data['pic_url']);
        $web_url = mysqli_real_escape_string($this->db, $data['web_url']);
        $priority = mysqli_real_escape_string($this->db, $data['priority']);
        $query = "UPDATE ads SET name='$name', start_date='$start_date', end_date='$end_date', pic_url='$pic_url', web_url='$web_url', priority='$priority' WHERE id=$id";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error updating Ad: " . mysqli_error($this->db));
        }
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE ads SET deleted = 'y' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error deleting Ad: " . mysqli_error($this->db));
        }
        return mysqli_affected_rows($this->db) > 0;
    }

    public function getCurrent(): array {
        $query = "SELECT * FROM ads WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY priority";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error fetching current Ads: " . mysqli_error($this->db));
        }
        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function updateOrder(int $id, int $priority): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $priority = mysqli_real_escape_string($this->db, $priority);
        $query = "UPDATE ads SET priority = '$priority' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        if (!$result) {
            throw new \RuntimeException("Error updating Ad order: " . mysqli_error($this->db));
        }
        return mysqli_affected_rows($this->db) > 0;
    }
} 