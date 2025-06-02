<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Story;
use mysqli;

class SqlStory implements Story {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM stories WHERE id = $id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching story by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(string|int $amount = 'all'): array {
        $query = "SELECT * FROM stories WHERE deleted = 'n' AND start_date <= now() AND end_date >= now() ORDER BY priority";

        $limit = ($amount === 'all') ? "" : " LIMIT " . intval($amount);
        $query = $query . $limit;

        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching stories: " . mysqli_error($this->db));
        }

        $odd_results = array();
        $even_results = array();

        for ($i = 1; $i <= mysqli_num_rows($result); $i++) {
            $info = mysqli_fetch_assoc($result);
            if (fmod($i, 2) == 0) {
                array_push($even_results, $info);
            } else {
                array_push($odd_results, $info);
            }
        }

        return array($odd_results, $even_results);
    }

    public function add(array $data): int {
        $requiredFields = ['headline', 'story', 'start_date', 'end_date', 'pic', 'pic_url', 'priority'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $headline = mysqli_real_escape_string($this->db, $data['headline']);
        $story = mysqli_real_escape_string($this->db, $data['story']);
        $start_date = mysqli_real_escape_string($this->db, $data['start_date']);
        $end_date = mysqli_real_escape_string($this->db, $data['end_date']);
        $pic = mysqli_real_escape_string($this->db, $data['pic']);
        $pic_url = mysqli_real_escape_string($this->db, $data['pic_url']);
        $priority = mysqli_real_escape_string($this->db, $data['priority']);

        $query = "INSERT INTO stories VALUES (id, '$start_date', '$end_date', '$headline', '$story', '$pic', '$pic_url', '$priority', 'n')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding story: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['headline', 'story', 'start_date', 'end_date', 'pic', 'pic_url', 'priority'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $headline = mysqli_real_escape_string($this->db, $data['headline']);
        $story = mysqli_real_escape_string($this->db, $data['story']);
        $start_date = mysqli_real_escape_string($this->db, $data['start_date']);
        $end_date = mysqli_real_escape_string($this->db, $data['end_date']);
        $pic = mysqli_real_escape_string($this->db, $data['pic']);
        $pic_url = mysqli_real_escape_string($this->db, $data['pic_url']);
        $priority = mysqli_real_escape_string($this->db, $data['priority']);

        $query = "UPDATE stories SET 
                 start_date = '$start_date',
                 end_date = '$end_date',
                 headline = '$headline',
                 story = '$story',
                 pic = '$pic',
                 pic_url = '$pic_url',
                 priority = '$priority'
                 WHERE id = $id";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update story: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE stories SET deleted = 'y' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to delete story: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function updatePriorities(array $priorities): bool {
        if (empty($priorities)) {
            return false;
        }

        $success = true;
        foreach ($priorities as $id => $priority) {
            $id = mysqli_real_escape_string($this->db, $id);
            $priority = mysqli_real_escape_string($this->db, $priority);
            $query = "UPDATE stories SET priority = '$priority' WHERE id = $id";
            $result = mysqli_query($this->db, $query);
            if (!$result) {
                $success = false;
            }
        }
        
        return $success;
    }

    public function getAllActive(): array {
        $query = "SELECT * FROM stories WHERE deleted = 'n' AND end_date >= now() ORDER BY priority";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching active stories: " . mysqli_error($this->db));
        }

        $stories = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $stories[] = $row;
        }
        
        return $stories;
    }
}
