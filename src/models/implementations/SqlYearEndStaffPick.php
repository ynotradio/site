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
        $query = "SELECT * FROM year_end_staff_picks WHERE deleted = 'n' AND id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result) {
            throw new \RuntimeException("Error fetching staff pick by ID");
        }

        return $result->fetch_assoc() ?: null;
    }

    public function getAll(): array {
        $query = "SELECT * FROM year_end_staff_picks WHERE deleted = 'n' ORDER BY order_id";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \RuntimeException("Error fetching staff picks");
        }

        $staffPicks = [];
        while ($row = $result->fetch_assoc()) {
            $staffPicks[] = $row;
        }

        return $staffPicks;
    }

    public function getCount(): int {
        $query = "SELECT order_id FROM year_end_staff_picks WHERE deleted = 'n' ORDER BY order_id DESC LIMIT 1";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \RuntimeException("Error fetching staff pick count");
        }

        $row = $result->fetch_assoc();
        return $row ? (int)$row['order_id'] : 0;
    }

    public function add(array $data): int {
        $query = "INSERT INTO year_end_staff_picks (order_id, html, deleted) VALUES (?, ?, 'n')";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('is', $data['order_id'], $data['html']);

        if (!$stmt->execute()) {
            throw new \RuntimeException("Error adding staff pick");
        }

        return $this->getLastInsertId();
    }

    /**
     * Get the last inserted row ID
     *
     * Extracted into a protected method so it can be overridden in tests,
     * since mysqli::$insert_id is a read-only property in PHP 8.3+ that
     * cannot be set on mock objects.
     */
    protected function getLastInsertId(): int
    {
        return $this->db->insert_id;
    }

    public function update(int $id, array $data): bool {
        $query = "UPDATE year_end_staff_picks SET order_id = ?, html = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('isi', $data['order_id'], $data['html'], $id);

        if (!$stmt->execute()) {
            throw new \RuntimeException("Error updating staff pick");
        }

        return true;
    }

    public function delete(int $id): bool {
        $query = "UPDATE year_end_staff_picks SET deleted = 'y' WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('i', $id);

        if (!$stmt->execute()) {
            throw new \RuntimeException("Error deleting staff pick");
        }

        return true;
    }
}
