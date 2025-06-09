<?php

// filepath: /workspaces/site/src/models/implementations/SqlModernRockMadness.php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\ModernRockMadness;

/**
 * SQL implementation of the ModernRockMadness interface
 * 
 * This implementation focuses on public voter-facing functionality for the
 * Modern Rock Madness tournament system.
 */
class SqlModernRockMadness implements ModernRockMadness
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
    public function getCurrentMatch(): ?array
    {
        $query = "SELECT * FROM mrm_matches WHERE now() >= start_time AND now() < end_time";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error finding current match: ' . mysqli_error($this->db));
        }

        $match = mysqli_fetch_assoc($result);

        if (!$match) {
            return ['id' => '8888']; // Special ID for no current match
        }

        return $match;
    }

    /**
     * {@inheritdoc}
     */
    public function getMatch(int $matchId): ?array
    {
        $matchId = mysqli_real_escape_string($this->db, (string)$matchId);
        $query = "SELECT * FROM mrm_matches WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error finding match: ' . mysqli_error($this->db));
        }

        $match = mysqli_fetch_assoc($result);
        return $match ?: null;
    }

    /**
     * {@inheritdoc}
     */
    public function getNextMatch(): ?array
    {
        $query = "SELECT id, band1_id, band2_id, start_time, DATE_FORMAT(start_time, '%h:%i') as fdate FROM mrm_matches WHERE now() < start_time ORDER BY start_time LIMIT 1";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error finding next match: ' . mysqli_error($this->db));
        }

        $match = mysqli_fetch_assoc($result);
        return $match ?: null;
    }

    /**
     * {@inheritdoc}
     */
    public function getBandByPlacement(int $placement): ?array
    {
        // If placement is 0, return a TBD band
        if ($placement === 0) {
            return [
                'id' => 0,
                'name' => 'TBD',
                'url' => '',
                'pic_url' => '',
                'placement' => 0,
                'seed' => '',
                'abbr' => 'TBD',
                'sponsor' => ''
            ];
        }
        
        $placement = mysqli_real_escape_string($this->db, (string)$placement);
        $query = "SELECT * FROM mrm_bands WHERE placement = " . $placement;
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error finding band: ' . mysqli_error($this->db));
        }

        $band = mysqli_fetch_assoc($result);
        
        // If no band found, return a placeholder
        if (!$band) {
            return [
                'id' => $placement,
                'name' => 'Band #' . $placement,
                'url' => '',
                'pic_url' => '',
                'placement' => $placement,
                'seed' => $placement,
                'abbr' => 'B' . $placement,
                'sponsor' => ''
            ];
        }
        
        return $band;
    }

    /**
     * {@inheritdoc}
     */
    public function getMatchStatus(int $matchId): string
    {
        $match = $this->getMatch($matchId);
        
        if (!$match) {
            return "early"; // Default to early if match not found
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
    public function isTournamentOver(): bool
    {
        $query = "SELECT * FROM mrm_matches WHERE id=63";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error checking tournament status: ' . mysqli_error($this->db));
        }

        $finalMatch = mysqli_fetch_assoc($result);
        return $finalMatch && $finalMatch['winner_id'] != 0;
    }

    /**
     * {@inheritdoc}
     */
    public function isWaitingForFinal(): bool
    {
        $query = "SELECT * FROM mrm_matches WHERE id=63";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error checking final status: ' . mysqli_error($this->db));
        }

        $finalMatch = mysqli_fetch_assoc($result);
        $now = date("Y-m-d H:i:s");
        
        return $finalMatch && $finalMatch['end_time'] < $now && $finalMatch['winner_id'] == 0;
    }

    /**
     * {@inheritdoc}
     */
    public function getChampion(): ?array
    {
        $query = "SELECT * FROM mrm_matches WHERE id=63";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error finding champion: ' . mysqli_error($this->db));
        }

        $finalMatch = mysqli_fetch_assoc($result);
        
        if (!$finalMatch || $finalMatch['winner_id'] == 0) {
            return null;
        }

        return $this->getBandByPlacement($finalMatch['winner_id']);
    }

    /**
     * {@inheritdoc}
     */
    public function getTournamentYear(?string $startDate = null): string
    {
        if ($startDate === null) {
            return date('Y');
        }
        
        return date('Y', strtotime($startDate));
    }

    /**
     * {@inheritdoc}
     */
    public function hasVoted(int $matchId, string $voterEmail): bool
    {
        $matchId = mysqli_real_escape_string($this->db, (string)$matchId);
        $voterEmail = mysqli_real_escape_string($this->db, $voterEmail);
        
        $query = "SELECT match_id, voter_email FROM mrm_votes WHERE match_id = " . $matchId . " AND voter_email = '" . $voterEmail . "'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error checking vote status: ' . mysqli_error($this->db));
        }

        $vote = mysqli_fetch_assoc($result);
        return $vote && $vote['match_id'] != '';
    }

    /**
     * {@inheritdoc}
     */
    public function recordVote(int $matchId, int $bandNumber, string $voterEmail, string $voterIp): bool
    {
        // Check if user has already voted
        if ($this->hasVoted($matchId, $voterEmail)) {
            return false; // Already voted
        }

        // Get match info
        $match = $this->getMatch($matchId);
        if (!$match) {
            throw new \Exception('Match not found');
        }

        // Check if match has ended
        $now = date("Y-m-d H:i:s");
        if ($now >= $match['end_time']) {
            return false; // Match has ended
        }

        // Validate band number
        if ($bandNumber != 1 && $bandNumber != 2) {
            throw new \Exception('Invalid band number');
        }

        // Update vote count
        $voteColumn = "band" . $bandNumber . "_votes";
        $currentVotes = $match[$voteColumn];
        $newVotes = $currentVotes + 1;

        $matchId = mysqli_real_escape_string($this->db, (string)$matchId);
        $newVotes = mysqli_real_escape_string($this->db, (string)$newVotes);

        $updateQuery = "UPDATE mrm_matches SET " . $voteColumn . " = " . $newVotes . " WHERE id = " . $matchId;
        $updateResult = mysqli_query($this->db, $updateQuery);

        if (!$updateResult) {
            throw new \Exception('Error updating vote count: ' . mysqli_error($this->db));
        }

        // Record the vote
        $voterEmail = mysqli_real_escape_string($this->db, $voterEmail);
        $voterIp = mysqli_real_escape_string($this->db, $voterIp);
        $votedBand = $match["band" . $bandNumber . "_id"];

        $insertQuery = "INSERT INTO mrm_votes VALUES (id, '" . $matchId . "', '" . $voterIp . "', '" . $votedBand . "', '" . $voterEmail . "')";
        $insertResult = mysqli_query($this->db, $insertQuery);

        if (!$insertResult) {
            throw new \Exception('Error recording vote: ' . mysqli_error($this->db));
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function calculateVotePercentage(int $votes1, int $votes2, string $display = 'none'): string
    {
        if ($votes1 == 0 && $votes2 == 0) {
            if ($display == 'none') {
                return "";
            } else {
                return "50%";
            }
        } else {
            return round((($votes1 / ($votes1 + $votes2)) * 100), 0) . '%';
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getBracketMatches(): array
    {
        $matches = [];
        
        for ($region = 1; $region <= 5; $region++) {
            $region = mysqli_real_escape_string($this->db, (string)$region);
            $query = "SELECT * FROM mrm_matches WHERE region = " . $region . " ORDER BY id ASC";
            $result = mysqli_query($this->db, $query);

            if (!$result) {
                throw new \Exception('Error getting bracket matches: ' . mysqli_error($this->db));
            }

            $regionMatches = [];
            while ($match = mysqli_fetch_assoc($result)) {
                $regionMatches[] = $match;
            }
            
            $matches[$region] = $regionMatches;
        }

        return $matches;
    }

    /**
     * {@inheritdoc}
     */
    public function getTimelineData(string $startDate): array
    {
        // This is a placeholder implementation - the actual timeline calculation
        // logic can be extracted from mrm_fns.php later
        $startTimestamp = strtotime($startDate);
        
        return [
            'first_round_left' => date('M j', $startTimestamp),
            'second_round_left' => date('M j', strtotime('+2 days', $startTimestamp)),
            'sweet_16' => date('M j', strtotime('+4 days', $startTimestamp)),
            'elusive_8' => date('M j', strtotime('+6 days', $startTimestamp)),
            'final_4' => date('M j', strtotime('+8 days', $startTimestamp)),
            'championship' => date('M j', strtotime('+10 days', $startTimestamp)),
            'second_round_right' => date('M j', strtotime('+2 days', $startTimestamp)),
            'first_round_right' => date('M j', strtotime('+1 day', $startTimestamp)),
        ];
    }
}
