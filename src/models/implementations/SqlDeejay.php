<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Deejay;
use mysqli;

class SqlDeejay implements Deejay {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM deejays WHERE id = $id AND deleted = 'no'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching deejay by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(int $limit = 64): array {
        $josh_query = "SELECT * FROM deejays WHERE deleted = 'no' AND name = 'Josh T. Landow' ORDER BY name";
        $josh_result = mysqli_query($this->db, $josh_query);
      
        if (!$josh_result) {
            throw new \RuntimeException("Error fetching Josh: " . mysqli_error($this->db));
        }
      
        $query = "SELECT * FROM deejays WHERE deleted = 'no' AND name != 'Josh T. Landow' ORDER BY sort";
        $result = mysqli_query($this->db, $query);
      
        if (!$result) {
            throw new \RuntimeException("Error fetching all deejays: " . mysqli_error($this->db));
        }
      
        $josh = array(mysqli_fetch_assoc($josh_result));
        $odd_results = array();
        $even_results = array();
      
        for ($i=1; $i <= mysqli_num_rows($result); $i++){
            $info = mysqli_fetch_assoc($result);
            if (fmod($i,2) == 0) {
                array_push($even_results, $info);
            } else {
                array_push($odd_results, $info);
            }
        }
      
        return array($josh, $odd_results, $even_results);
    }

    public function getAllFlat(): array {
        $query = "SELECT * FROM deejays WHERE deleted = 'no' ORDER BY sort";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching all deejays: " . mysqli_error($this->db));
        }

        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function add(array $data): int {
        $requiredFields = ['name', 'show', 'email', 'external_connect_text', 'external_connect_url', 'pic'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $name = mysqli_real_escape_string($this->db, $data['name']);
        $show = mysqli_real_escape_string($this->db, $data['show']);
        $email = mysqli_real_escape_string($this->db, $data['email']);
        $external_connect_text = mysqli_real_escape_string($this->db, $data['external_connect_text']);
        $external_connect_url = mysqli_real_escape_string($this->db, $data['external_connect_url']);
        $pic = mysqli_real_escape_string($this->db, $data['pic']);

        $query = "INSERT INTO deejays (name, `show`, email, external_connect_text, external_connect_url, pic, sort, deleted) 
                 VALUES ('$name', '$show', '$email', '$external_connect_text', '$external_connect_url', '$pic', 1, 'no')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding deejay: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['name', 'show', 'email', 'external_connect_text', 'external_connect_url', 'pic'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $name = mysqli_real_escape_string($this->db, $data['name']);
        $show = mysqli_real_escape_string($this->db, $data['show']);
        $email = mysqli_real_escape_string($this->db, $data['email']);
        $external_connect_text = mysqli_real_escape_string($this->db, $data['external_connect_text']);
        $external_connect_url = mysqli_real_escape_string($this->db, $data['external_connect_url']);
        $pic = mysqli_real_escape_string($this->db, $data['pic']);

        $query = "UPDATE deejays SET 
                 name = '$name',
                 `show` = '$show',
                 email = '$email',
                 external_connect_text = '$external_connect_text',
                 external_connect_url = '$external_connect_url',
                 pic = '$pic'
                 WHERE id = $id AND deleted = 'no'";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update deejay: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE deejays SET deleted = 'yes' WHERE id = $id";
        return mysqli_query($this->db, $query);
    }

    public function getName(int $id): string {
        $deejay = $this->getById($id);
        if (!$deejay) {
            throw new \RuntimeException("Deejay not found with ID: $id");
        }
        return $deejay['name'];
    }

    public function updateSortOrder(array $items): bool {
        if (empty($items)) {
            return false;
        }

        $success = true;
        for ($i = 0; $i < count($items); $i++) {
            $id = mysqli_real_escape_string($this->db, $items[$i]);
            $sort = $i;
            $query = "UPDATE deejays SET sort = $sort WHERE id = $id";
            $result = mysqli_query($this->db, $query);
            if (!$result) {
                $success = false;
            }
        }
        
        return $success;
    }
}
