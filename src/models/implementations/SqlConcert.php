<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Concert;
use mysqli;

class SqlConcert implements Concert {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM concerts WHERE id = $id AND deleted = 'n'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching concert by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getAll(int $limit = 64): array {
        $limit = mysqli_real_escape_string($this->db, $limit);
        $query = "SELECT * FROM concerts WHERE deleted = 'n' ORDER BY date DESC LIMIT $limit";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching all concerts: " . mysqli_error($this->db));
        }

        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function getUpcoming(int $limit = 64): array {
        $limit = mysqli_real_escape_string($this->db, $limit);
        $query = "SELECT * FROM concerts WHERE deleted = 'n' AND date >= date(now()) ORDER BY date LIMIT $limit";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching upcoming concerts: " . mysqli_error($this->db));
        }

        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function getFeatured(int $limit = 5): array {
        $limit = mysqli_real_escape_string($this->db, $limit);
        $query = "SELECT * FROM concerts WHERE deleted = 'n' AND featured = 'Yes' AND date >= date(now()) ORDER BY date LIMIT $limit";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching featured concerts: " . mysqli_error($this->db));
        }

        $data = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data[] = $row;
        }
        return $data;
    }

    public function add(array $data): int {
        $requiredFields = ['date', 'artist', 'venue', 'ticketinfo'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new \InvalidArgumentException("Missing required field: $field");
            }
        }

        $date = mysqli_real_escape_string($this->db, $data['date']);
        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $band_pic_url = isset($data['band_pic_url']) ? mysqli_real_escape_string($this->db, $data['band_pic_url']) : '';
        $band_url = isset($data['band_url']) ? mysqli_real_escape_string($this->db, $data['band_url']) : '';
        $venue = mysqli_real_escape_string($this->db, $data['venue']);
        $ticketinfo = mysqli_real_escape_string($this->db, $data['ticketinfo']);
        $ticketurl = isset($data['ticketurl']) ? mysqli_real_escape_string($this->db, $data['ticketurl']) : '';
        $featured = isset($data['featured']) && $data['featured'] === 'Yes' ? 'Yes' : 'No';

        $query = "INSERT INTO concerts (date, artist, band_pic_url, band_url, venue, ticketinfo, ticketurl, featured, deleted) 
                 VALUES ('$date', '$artist', '$band_pic_url', '$band_url', '$venue', '$ticketinfo', '$ticketurl', '$featured', 'n')";
        
        if (!mysqli_query($this->db, $query)) {
            throw new \RuntimeException("Error adding concert: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $requiredFields = ['date', 'artist', 'venue', 'ticketinfo'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                throw new \InvalidArgumentException("Missing or empty required field: $field");
            }
        }

        $id = mysqli_real_escape_string($this->db, $id);
        $date = mysqli_real_escape_string($this->db, $data['date']);
        $artist = mysqli_real_escape_string($this->db, $data['artist']);
        $band_pic_url = isset($data['band_pic_url']) ? mysqli_real_escape_string($this->db, $data['band_pic_url']) : '';
        $band_url = isset($data['band_url']) ? mysqli_real_escape_string($this->db, $data['band_url']) : '';
        $venue = mysqli_real_escape_string($this->db, $data['venue']);
        $ticketinfo = mysqli_real_escape_string($this->db, $data['ticketinfo']);
        $ticketurl = isset($data['ticketurl']) ? mysqli_real_escape_string($this->db, $data['ticketurl']) : '';
        $featured = isset($data['featured']) && $data['featured'] === 'Yes' ? 'Yes' : 'No';

        $query = "UPDATE concerts SET 
                 date = '$date',
                 artist = '$artist',
                 band_pic_url = '$band_pic_url',
                 band_url = '$band_url',
                 venue = '$venue',
                 ticketinfo = '$ticketinfo',
                 ticketurl = '$ticketurl',
                 featured = '$featured'
                 WHERE id = $id AND deleted = 'n'";

        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Failed to update concert: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "UPDATE concerts SET deleted = 'y' WHERE id = $id";
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Error deleting concert: " . mysqli_error($this->db));
        }
        
        return mysqli_affected_rows($this->db) > 0;
    }

    public function getConcertInfo(int $id): string {
        $concert = $this->getById($id);
        
        if (!$concert) {
            throw new \RuntimeException("Concert not found with ID: $id");
        }
        
        return $concert['artist'] . " at " . $concert['venue'];
    }
}
