<?php

namespace YNotRadio\Models\Implementations;

require_once __DIR__ . '/../ModernRockMadness.php';

use YNotRadio\Models\ModernRockMadness;

/**
 * SQL implementation of the ModernRockMadness interface
 */
class SqlModernRockMadness implements ModernRockMadness
{
    /**
     * @var \mysqli Database connection
     */
    private $db;

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
    public function getBandById(int $id): ?array
    {
        $query = "SELECT * FROM mrm_bands WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandByPlacement(int $placement): ?array
    {
        if ($placement === 0) {
            return [
                'name' => 'TBD',
                'seed' => '',
                'pic_url' => '',
                'url' => '',
                'abbr' => 'TBD'
            ];
        }
        
        $query = "SELECT * FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandName(int $id): string
    {
        $query = "SELECT name FROM mrm_bands WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return $info['name'];
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandAbbr(int $placement): string
    {
        $query = "SELECT abbr FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return $info['abbr'];
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandPicUrl(int $placement): string
    {
        $query = "SELECT pic_url FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return $info['pic_url'];
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandUrl(int $placement): string
    {
        $query = "SELECT url FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return $info['url'];
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function getSeed(int $placement): string
    {
        $query = "SELECT seed FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return $info['seed'];
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function getSponsorName(int $placement): string
    {
        $query = "SELECT sponsor, seed FROM mrm_bands WHERE placement = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $placement);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return "<span class='seed_size'>Sponsored by: " . $info['sponsor'] . "</span> ";
        }
        
        return '';
    }
    
    /**
     * {@inheritdoc}
     */
    public function addBand(array $data): int
    {
        $query = "INSERT INTO mrm_bands VALUES (id, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param(
            "sssssss",
            $data['name'],
            $data['url'],
            $data['pic_url'],
            $data['placement'],
            $data['seed'],
            $data['abbr'],
            $data['sponsor']
        );
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        
        return 0;
    }
    
    /**
     * {@inheritdoc}
     */
    public function updateBand(int $id, array $data): bool
    {
        $query = "UPDATE mrm_bands SET name=?, url=?, pic_url=?, placement=?, seed=?, abbr=?, sponsor=? WHERE id=?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param(
            "sssssssi",
            $data['name'],
            $data['url'],
            $data['pic_url'],
            $data['placement'],
            $data['seed'],
            $data['abbr'],
            $data['sponsor'],
            $id
        );
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function deleteBand(int $id): bool
    {
        $query = "DELETE FROM mrm_bands WHERE id=?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function getAllBands(): array
    {
        $query = "SELECT * FROM mrm_bands ORDER BY placement";
        $result = $this->db->query($query);
        
        $bands = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $bands[] = $row;
            }
        }
        
        return $bands;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatchById(int $id): ?array
    {
        $query = "SELECT * FROM mrm_matches WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatchSponsor(int $id): ?array
    {
        return $this->getMatchById($id);
    }
    
    /**
     * {@inheritdoc}
     */
    public function updateMatchSponsor(int $matchId, string $sponsor, string $sponsorMsg): bool
    {
        $query = "UPDATE mrm_matches SET sponsor=?, sponsor_msg=? WHERE id=?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ssi", $sponsor, $sponsorMsg, $matchId);
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function getCurrentMatch(): ?array
    {
        $query = "SELECT * FROM mrm_matches WHERE NOW() >= start_time AND NOW() < end_time";
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return ['id' => 8888]; // Special case when no match is running
    }
    
    /**
     * {@inheritdoc}
     */
    public function getNextMatch(): ?array
    {
        $query = "SELECT id, band1_id, band2_id, start_time, DATE_FORMAT(start_time, '%h:%i') as fdate 
                 FROM mrm_matches WHERE NOW() < start_time ORDER BY start_time LIMIT 1";
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatchesByRound(int $round): array
    {
        $query = $this->getQueryForRound($round);
        $result = $this->db->query($query);
        
        $matches = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $matches[] = $row;
            }
        }
        
        return $matches;
    }
    
    /**
     * Get the SQL query for a specific round
     * 
     * @param int $round The round number
     * @return string The SQL query
     */
    private function getQueryForRound(int $round): string
    {
        switch ($round) {
            case 1:
                return "SELECT * FROM mrm_matches WHERE id > 0 AND ID <= 32 ORDER BY winner_id, id";
            case 2:
                return "SELECT * FROM mrm_matches WHERE id > 32 AND ID <= 48 ORDER BY winner_id, id";
            case 3:
                return "SELECT * FROM mrm_matches WHERE id > 48 AND ID <= 56 ORDER BY winner_id, id";
            case 4:
                return "SELECT * FROM mrm_matches WHERE id > 56 AND ID <= 60 ORDER BY winner_id, id";
            case 5:
                return "SELECT * FROM mrm_matches WHERE id > 60 AND ID <= 62 ORDER BY winner_id, id";
            case 6:
                return "SELECT * FROM mrm_matches WHERE id = 63";
            default:
                return "SELECT * FROM mrm_matches WHERE id = 0"; // Empty result for invalid round
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function vote(int $matchId, int $bandNumber, string $voterEmail, bool $bypassIpCheck = false): bool
    {
        // Get match details
        $match = $this->getMatchById($matchId);
        if (!$match) {
            return false;
        }
        
        // Check if match is over
        if (strtotime($match['end_time']) < strtotime('now')) {
            return false;
        }
        
        // Check if user has already voted
        if (!$bypassIpCheck && $this->hasVoted($matchId, $voterEmail)) {
            return false;
        }
        
        // Update vote count
        $band = "band{$bandNumber}_votes";
        $bandId = "band{$bandNumber}_id";
        $votedBand = $match[$bandId];
        
        $query = "UPDATE mrm_matches SET {$band} = {$band} + 1 WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $matchId);
        
        if (!$stmt->execute()) {
            return false;
        }
        
        // Record the vote
        return $this->recordVote($matchId, $votedBand, $voterEmail);
    }
    
    /**
     * Record a vote in the votes table
     * 
     * @param int $matchId The match ID
     * @param int $votedBand The voted band ID
     * @param string $voterEmail The voter's email
     * @return bool True if successful
     */
    private function recordVote(int $matchId, int $votedBand, string $voterEmail): bool
    {
        $voterIp = $_SERVER['REMOTE_ADDR'];
        
        $query = "INSERT INTO mrm_votes VALUES (id, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("issi", $matchId, $voterIp, $votedBand, $voterEmail);
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function hasVoted(int $matchId, string $voterEmail): bool
    {
        if (empty($voterEmail)) {
            return false;
        }
        
        $query = "SELECT match_id FROM mrm_votes WHERE match_id = ? AND voter_email = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("is", $matchId, $voterEmail);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return ($result && $result->num_rows > 0);
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatchStatus(int $matchId): string
    {
        $match = $this->getMatchById($matchId);
        if (!$match) {
            return 'invalid';
        }
        
        $now = date("Y-m-d H:i:s");
        
        if ($now > $match['end_time']) {
            return "over";
        } elseif ($now > $match['start_time']) {
            return "running";
        } else {
            return "early";
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function isMatchTied(array $match): bool
    {
        return ($match['band1_votes'] == $match['band2_votes']);
    }
    
    /**
     * {@inheritdoc}
     */
    public function closeMatch(int $matchId, int $round): bool
    {
        $winnerId = $this->setWinner($matchId);
        $this->enableScore($matchId);
        
        if ($matchId < 63) {
            $this->setupNextMatch($matchId, $winnerId);
        }
        
        return true;
    }
    
    /**
     * {@inheritdoc}
     */
    public function enableScore(int $matchId): bool
    {
        $query = "UPDATE mrm_matches SET show_score = true WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $matchId);
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function setWinner(int $matchId): int
    {
        $match = $this->getMatchById($matchId);
        if (!$match) {
            return 0;
        }
        
        $winner = ($match['band1_votes'] > $match['band2_votes']) 
                ? $match['band1_id'] 
                : $match['band2_id'];
        
        $query = "UPDATE mrm_matches SET winner_id = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ii", $winner, $matchId);
        
        if ($stmt->execute()) {
            return $winner;
        }
        
        return 0;
    }
    
    /**
     * {@inheritdoc}
     */
    public function setupNextMatch(int $lastMatchId, int $winnerId): bool
    {
        $newMatch = $this->getNewMatch($lastMatchId);
        if (!$newMatch) {
            return false;
        }
        
        // Determine if the winner goes to band1_id or band2_id
        $bandValue = $lastMatchId & 1; // 0 = even (band2), 1 = odd (band1)
        
        if ($bandValue == 1) {
            $query = "UPDATE mrm_matches SET band1_id = ? WHERE id = ?";
        } else {
            $query = "UPDATE mrm_matches SET band2_id = ? WHERE id = ?";
        }
        
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("ii", $winnerId, $newMatch);
        
        return $stmt->execute();
    }
    
    /**
     * {@inheritdoc}
     */
    public function getNewMatch(int $oldMatchId): int
    {
        $query = "SELECT new FROM mrm_matches_flow WHERE old = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $oldMatchId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return (int)$info['new'];
        }
        
        return 0;
    }
    
    /**
     * {@inheritdoc}
     */
    public function endOfMadness(): bool
    {
        $query = "SELECT winner_id FROM mrm_matches WHERE id = 63";
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            return ($info['winner_id'] != 0);
        }
        
        return false;
    }
    
    /**
     * {@inheritdoc}
     */
    public function waitingForFinal(): bool
    {
        $query = "SELECT end_time FROM mrm_matches WHERE id = 63";
        $result = $this->db->query($query);
        
        if ($result && $result->num_rows > 0) {
            $info = $result->fetch_assoc();
            $now = date("Y-m-d H:i:s");
            return ($info['end_time'] < $now);
        }
        
        return false;
    }
    
    /**
     * {@inheritdoc}
     */
    public function votePercentage(int $val1, int $val2, string $display = 'none'): string
    {
        if ($val1 == 0 && $val2 == 0) {
            if ($display == 'none') {
                return "";
            } else {
                return "50%";
            }
        } else {
            return round((($val1 / ($val1 + $val2)) * 100), 0) . '%';
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getTournamentDates(string $startDate): array
    {
        // Parse the start date
        $tournamentStart = strtotime($startDate);
        
        // Ensure the start date is a Monday (1 = Monday, 7 = Sunday)
        $dayOfWeek = date('N', $tournamentStart);
        if ($dayOfWeek != 1) {
            // Adjust to next Monday if not already a Monday
            $tournamentStart = strtotime('next Monday', $tournamentStart);
        }
        
        // Calculate all tournament dates
        $dates = [];
        
        // First Round - Left side (Monday-Tuesday of Week 1)
        $firstRoundLeftStart = $tournamentStart;
        $firstRoundLeftEnd = strtotime('+1 day', $firstRoundLeftStart);
        $dates['first_round_left'] = date('F j', $firstRoundLeftStart) . '-' . date('j', $firstRoundLeftEnd);
        
        // First Round - Right side (Wednesday-Thursday of Week 1)
        $firstRoundRightStart = strtotime('+2 days', $firstRoundLeftStart);
        $firstRoundRightEnd = strtotime('+1 day', $firstRoundRightStart);
        $dates['first_round_right'] = date('F j', $firstRoundRightStart) . '-' . date('j', $firstRoundRightEnd);
        
        // Second Round - Left side (Monday of Week 2)
        $secondRoundLeft = strtotime('+7 days', $firstRoundLeftStart);
        $dates['second_round_left'] = date('F j', $secondRoundLeft);
        
        // Second Round - Right side (Tuesday of Week 2)
        $secondRoundRight = strtotime('+1 day', $secondRoundLeft);
        $dates['second_round_right'] = date('F j', $secondRoundRight);
        
        // Sweet 16 - Both sides (Wednesday of Week 2)
        $sweet16 = strtotime('+2 days', $secondRoundLeft);
        $dates['sweet_16'] = date('F j', $sweet16);
        
        // Elusive 8 - Both sides (Thursday of Week 2)
        $elusive8 = strtotime('+3 days', $secondRoundLeft);
        $dates['elusive_8'] = date('F j', $elusive8);
        
        // Final 4 - Both sides (Thursday of Week 2, same day as Elusive 8)
        $dates['final_4'] = date('F j', $elusive8);
        
        // Championship (Friday of Week 2)
        $championship = strtotime('+4 days', $secondRoundLeft);
        $dates['championship'] = date('F j', $championship);
        
        return $dates;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getTournamentYear(?string $startDate = null): string
    {
        if ($startDate === null) {
            // Default to current year if no date is provided
            return date('Y');
        }
        
        return date('Y', strtotime($startDate));
    }
}
