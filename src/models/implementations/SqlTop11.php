<?php
// filepath: /workspaces/site/src/models/implementations/SqlTop11.php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Top11;

/**
 * SQL implementation of the Top11 interface
 */
class SqlTop11 implements Top11
{
    /**
     * @var \mysqli Database connection
     */
    private \mysqli $db;

    /**
     * Constructor
     *
     * @param \mysqli $db Database connection
     */
    public function __construct(\mysqli $db)
    {
        $this->db = $db;
    }

    /**
     * {@inheritdoc}
     */
    public function getById(int $id): ?array
    {
        $query = "SELECT * FROM top11 WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result || $result->num_rows === 0) {
            return null;
        }

        return $result->fetch_assoc();
    }

    /**
     * {@inheritdoc}
     */
    public function getAll(): array
    {
        $query = "SELECT * FROM top11";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving Top11 data: ' . $this->db->error);
        }

        $entries = [];
        while ($row = $result->fetch_assoc()) {
            $entries[] = $row;
        }

        return $entries;
    }

    /**
     * {@inheritdoc}
     */
    public function getStatus(): string
    {
        $query = "SELECT artist FROM top11 WHERE placement = 98";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving Top11 status: ' . $this->db->error);
        }

        $info = $result->fetch_assoc();
        return $info['artist'];
    }

    /**
     * {@inheritdoc}
     */
    public function toggleStatus(string $currentStatus): bool
    {
        if ($currentStatus === 'open') {
            // Close voting
            $update = "UPDATE top11 SET artist = 'closed' WHERE placement = 98";
        } else {
            // Open voting
            $update = "UPDATE top11 SET artist = 'open' WHERE placement = 98";
        }

        $result = $this->db->query($update);
        return $result !== false;
    }

    /**
     * {@inheritdoc}
     */
    public function update(int $placement, string $artist, string $song, string $note): bool
    {
        $query = "UPDATE top11 SET artist = ?, song = ?, note = ? WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("sssi", $artist, $song, $note, $placement);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function updateDate(string $date): bool
    {
        $query = "UPDATE top11 SET artist = ? WHERE placement = 99";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $date);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function updateMessage(string $message): bool
    {
        $query = "UPDATE top11message SET message = ? WHERE id = 1";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $message);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function getMessage(): array
    {
        $query = "SELECT * FROM top11message WHERE id = 1";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving Top11 message: ' . $this->db->error);
        }

        return $result->fetch_assoc();
    }

    /**
     * {@inheritdoc}
     */
    public function addSong(string $artist, string $song): int
    {
        $query = "INSERT INTO top11songs (artist, song, value, deleted) VALUES (?, ?, 0, 'n')";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ss", $artist, $song);

        if (!$stmt->execute()) {
            throw new \Exception('Error adding Top11 song: ' . $stmt->error);
        }

        return $this->db->insert_id;
    }

    /**
     * {@inheritdoc}
     */
    public function updateSong(int $id, string $artist, string $song): bool
    {
        $query = "UPDATE top11songs SET artist = ?, song = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssi", $artist, $song, $id);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function deleteSong(int $id): bool
    {
        $query = "UPDATE top11songs SET deleted = 'y' WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function getSong(int $id): ?array
    {
        $query = "SELECT * FROM top11songs WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if (!$result || $result->num_rows === 0) {
            return null;
        }

        return $result->fetch_assoc();
    }

    /**
     * {@inheritdoc}
     */
    public function getAllSongs(): array
    {
        $query = "SELECT * FROM top11songs WHERE deleted = 'n' ORDER BY artist";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving Top11 songs: ' . $this->db->error);
        }

        $songs = [];
        while ($row = $result->fetch_assoc()) {
            $songs[] = $row;
        }

        return $songs;
    }

    /**
     * {@inheritdoc}
     */
    public function addVote(int $id): bool
    {
        $query = "UPDATE top11songs SET value = value + 1 WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function addContestant(string $firstname, string $lastname, string $email, string $phone, string $contest, string $newsletter): bool
    {
        $query = "INSERT INTO top11contest (firstname, lastname, email, phone, contest, newsletter, display) VALUES (?, ?, ?, ?, ?, ?, 'yes')";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssssss", $firstname, $lastname, $email, $phone, $contest, $newsletter);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function getAllContestants(): array
    {
        $query = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes' ORDER BY id";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving Top11 contestants: ' . $this->db->error);
        }

        $contestants = [];
        while ($row = $result->fetch_assoc()) {
            $contestants[] = $row;
        }

        return $contestants;
    }

    /**
     * {@inheritdoc}
     */
    public function getContestantCount(): string
    {
        $query = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes'";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error counting Top11 contestants: ' . $this->db->error);
        }

        return "(" . $result->num_rows . " total entries)";
    }

    /**
     * {@inheritdoc}
     */
    public function pickWinner(): array
    {
        $query = "SELECT * FROM top11contest WHERE display = 'yes' AND contest = 'yes' ORDER BY RAND() LIMIT 1";
        $result = $this->db->query($query);

        if (!$result || $result->num_rows === 0) {
            throw new \Exception('Error selecting a Top11 winner: ' . $this->db->error);
        }

        return $result->fetch_assoc();
    }

    /**
     * {@inheritdoc}
     */
    public function getNewsletterSignups(): array
    {
        $query = "SELECT * FROM top11contest WHERE contest = 'no' AND newsletter = 'yes' AND display = 'yes' ORDER BY id";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving newsletter signups: ' . $this->db->error);
        }

        $signups = [];
        while ($row = $result->fetch_assoc()) {
            $signups[] = $row;
        }

        return $signups;
    }

    /**
     * {@inheritdoc}
     */
    public function addWriteIn(string $writeIn): bool
    {
        $query = "INSERT INTO write_in (write_in, deleted) VALUES (?, 'no')";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("s", $writeIn);
        return $stmt->execute();
    }

    /**
     * {@inheritdoc}
     */
    public function getAllWriteIns(): array
    {
        $query = "SELECT * FROM write_in WHERE deleted = 'no' ORDER BY id";
        $result = $this->db->query($query);

        if (!$result) {
            throw new \Exception('Error retrieving write-in votes: ' . $this->db->error);
        }

        $writeIns = [];
        while ($row = $result->fetch_assoc()) {
            $writeIns[] = $row;
        }

        return $writeIns;
    }

    /**
     * {@inheritdoc}
     */
    public function reset(): bool
    {
        $success = true;

        // Reset top11songs values
        $success = $success && $this->db->query("UPDATE top11songs SET value = 0");

        // Reset write_in entries
        $success = $success && $this->db->query("UPDATE write_in SET deleted = 'yes'");

        // Reset top11contest entries
        $success = $success && $this->db->query("UPDATE top11contest SET display = 'no'");

        // Reset IP addresses
        $success = $success && $this->db->query("UPDATE ip_address SET deleted = 'yes'");

        // Reset user votes for the current week
        $currentWeek = $this->getCurrentVotingWeek();
        $stmt = $this->db->prepare("DELETE FROM top11_user_votes WHERE vote_week = ?");
        $stmt->bind_param("s", $currentWeek);
        $success = $success && $stmt->execute();

        return $success;
    }

    /**
     * {@inheritdoc}
     */
    public function hasUserVotedThisWeek(string $userEmail, ?string $auth0Id = null): bool
    {
        try {
            $currentWeek = $this->getCurrentVotingWeek();
            
            $query = "SELECT COUNT(*) as count FROM top11_user_votes WHERE user_email = ? AND vote_week = ?";
            $stmt = $this->db->prepare($query);
            
            if (!$stmt) {
                // Table likely doesn't exist yet, return false (user hasn't voted)
                return false;
            }
            
            $stmt->bind_param("ss", $userEmail, $currentWeek);
            $stmt->execute();
            
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            return $row['count'] > 0;
        } catch (\Exception $e) {
            // If table doesn't exist or other error, assume user hasn't voted
            error_log("Error checking user vote: " . $e->getMessage());
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function recordUserVote(string $userEmail, ?string $auth0Id = null): bool
    {
        try {
            $currentWeek = $this->getCurrentVotingWeek();
            
            $query = "INSERT INTO top11_user_votes (user_email, vote_week, user_auth0_id) VALUES (?, ?, ?)";
            $stmt = $this->db->prepare($query);
            
            if (!$stmt) {
                // Table likely doesn't exist yet, return false
                error_log("Error preparing user vote record: " . $this->db->error);
                return false;
            }
            
            $stmt->bind_param("sss", $userEmail, $currentWeek, $auth0Id);
            
            return $stmt->execute();
        } catch (\Exception $e) {
            error_log("Error recording user vote: " . $e->getMessage());
            return false;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getCurrentVotingWeek(): string
    {
        // Get the Monday of the current week
        $currentDate = new \DateTime();
        $currentDate->modify('monday this week');
        return $currentDate->format('Y-m-d');
    }
}
