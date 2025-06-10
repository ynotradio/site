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
        $dates = $this->getTournamentDates($startDate);
        
        // Return simplified timeline data for display
        return [
            'first_round_left' => explode('-', $dates['first_round_left'])[0],
            'second_round_left' => $dates['second_round_left'],
            'sweet_16' => $dates['sweet_16'],
            'elusive_8' => $dates['elusive_8'],
            'final_4' => $dates['final_4'],
            'championship' => $dates['championship'],
            'second_round_right' => $dates['second_round_right'],
            'first_round_right' => explode('-', $dates['first_round_right'])[0],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function getTournamentDates(string $startDate): array
    {
        // Parse the start date
        $tournament_start = strtotime($startDate);
        
        // Ensure the start date is a Monday (1 = Monday, 7 = Sunday)
        $day_of_week = date('N', $tournament_start);
        if ($day_of_week != 1) {
            // Adjust to next Monday if not already a Monday
            $tournament_start = strtotime('next Monday', $tournament_start);
        }
        
        // Calculate all tournament dates
        $dates = [];
        
        // First Round - Left side (Monday-Tuesday of Week 1)
        $first_round_left_start = $tournament_start;
        $first_round_left_end = strtotime('+1 day', $first_round_left_start);
        $dates['first_round_left'] = date('F j', $first_round_left_start) . '-' . date('j', $first_round_left_end);
        
        // First Round - Right side (Wednesday-Thursday of Week 1)
        $first_round_right_start = strtotime('+2 days', $first_round_left_start);
        $first_round_right_end = strtotime('+1 day', $first_round_right_start);
        $dates['first_round_right'] = date('F j', $first_round_right_start) . '-' . date('j', $first_round_right_end);
        
        // Second Round - Left side (Monday of Week 2)
        $second_round_left = strtotime('+7 days', $first_round_left_start);
        $dates['second_round_left'] = date('F j', $second_round_left);
        
        // Second Round - Right side (Tuesday of Week 2)
        $second_round_right = strtotime('+1 day', $second_round_left);
        $dates['second_round_right'] = date('F j', $second_round_right);
        
        // Sweet 16 - Both sides (Wednesday of Week 2)
        $sweet_16 = strtotime('+2 days', $second_round_left);
        $dates['sweet_16'] = date('F j', $sweet_16);
        
        // Elusive 8 - Both sides (Thursday of Week 2)
        $elusive_8 = strtotime('+3 days', $second_round_left);
        $dates['elusive_8'] = date('F j', $elusive_8);
        
        // Final 4 - Both sides (Thursday of Week 2, same day as Elusive 8)
        $dates['final_4'] = date('F j', $elusive_8);
        
        // Championship (Friday of Week 2)
        $championship = strtotime('+4 days', $second_round_left);
        $dates['championship'] = date('F j', $championship);
        
        return $dates;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getWinnerClass(int $bandId, int $matchId): string
    {
        $matchId = mysqli_real_escape_string($this->db, (string)$matchId);
        $bandId = mysqli_real_escape_string($this->db, (string)$bandId);
        
        $query = "SELECT winner_id FROM mrm_matches WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \Exception('Error checking winner: ' . mysqli_error($this->db));
        }
        
        $match = mysqli_fetch_assoc($result);
        
        if (!$match || $match['winner_id'] == 0) {
            return '';
        }
        
        if ($match['winner_id'] == $bandId) {
            return ' mrm_winner';
        } else {
            return ' mrm_loser';
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function isMatchTied(array $match): bool
    {
        return $match['band1_votes'] == $match['band2_votes'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function getSponsorInfo(?int $matchId = null): ?array
    {
        if ($matchId === null) {
            // Use current match if match ID not provided
            $match = $this->getCurrentMatch();
            if (!$match || $match['id'] == 8888) {
                return null;
            }
            $matchId = $match['id'];
        }
        
        $matchId = mysqli_real_escape_string($this->db, (string)$matchId);
        $query = "SELECT sponsor, sponsor_msg FROM mrm_matches WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \Exception('Error getting sponsor info: ' . mysqli_error($this->db));
        }
        
        $sponsorInfo = mysqli_fetch_assoc($result);
        
        if (!$sponsorInfo || empty($sponsorInfo['sponsor'])) {
            return null;
        }
        
        return [
            'name' => $sponsorInfo['sponsor'],
            'message' => $sponsorInfo['sponsor_msg'] ?? ''
        ];
    }
}
