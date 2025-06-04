<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\YearEndStaffPick;
use mysqli;

class SqlYearEndStaffPick implements YearEndStaffPick {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM year_end_staff_picks WHERE deleted = 'n' AND id = $id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching staff pick by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(): array {
        $query = "SELECT * FROM year_end_staff_picks WHERE deleted = 'n' ORDER BY order_id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching staff picks: " . mysqli_error($this->db));
        }

        $staffPicks = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $staffPicks[] = $row;
        }

        return $staffPicks;
    }

    public function getCount(): int {
        $query = "SELECT order_id FROM year_end_staff_picks WHERE deleted = 'n' ORDER BY order_id DESC LIMIT 1";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching staff pick count: " . mysqli_error($this->db));
        }

        $row = mysqli_fetch_assoc($result);
        return $row ? (int)$row['order_id'] : 0;
    }

    public function add(array $data): int {
        $order = mysqli_real_escape_string($this->db, $data['order_id']);
        $html = mysqli_real_escape_string($this->db, $data['html']);

        $insert = "INSERT INTO year_end_staff_picks VALUES (id, '$order', '$html', 'n')";
        $result = mysqli_query($this->db, $insert);

        if (!$result) {
            throw new \RuntimeException("Error adding staff pick: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $order = mysqli_real_escape_string($this->db, $data['order_id']);
        $html = mysqli_real_escape_string($this->db, $data['html']);

        $update = "UPDATE year_end_staff_picks SET order_id = '$order', html = '$html' WHERE id = $id";
        $result = mysqli_query($this->db, $update);

        if (!$result) {
            throw new \RuntimeException("Error updating staff pick: " . mysqli_error($this->db));
        }

        return true;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $update = "UPDATE year_end_staff_picks SET deleted = 'y' WHERE id = $id";
        $result = mysqli_query($this->db, $update);

        if (!$result) {
            throw new \RuntimeException("Error deleting staff pick: " . mysqli_error($this->db));
        }

        return true;
    }
}
