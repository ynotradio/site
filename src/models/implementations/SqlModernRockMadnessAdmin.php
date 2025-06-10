<?php

// filepath: /workspaces/site/src/models/implementations/SqlModernRockMadnessAdmin.php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\ModernRockMadnessAdmin;

/**
 * SQL implementation of the ModernRockMadnessAdmin interface
 * 
 * This implementation handles administrative operations for the Modern Rock Madness
 * tournament system using direct SQL queries.
 */
class SqlModernRockMadnessAdmin implements ModernRockMadnessAdmin
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
    public function addBand(string $name, string $url, string $pic_url, int $placement, int $seed, string $abbr, string $sponsor)
    {
        $name = mysqli_real_escape_string($this->db, $name);
        $url = mysqli_real_escape_string($this->db, $url);
        $pic_url = mysqli_real_escape_string($this->db, $pic_url);
        $placement = mysqli_real_escape_string($this->db, (string)$placement);
        $seed = mysqli_real_escape_string($this->db, (string)$seed);
        $abbr = mysqli_real_escape_string($this->db, $abbr);
        $sponsor = mysqli_real_escape_string($this->db, $sponsor);

        $insert = "INSERT INTO mrm_bands VALUES (id, '" . $name . "', '" . $url . "', '" . $pic_url . "', '" . $placement . "', '" . $seed . "', '" . $abbr . "','" . $sponsor . "')";
        $result = mysqli_query($this->db, $insert);

        if (!$result) {
            return false;
        }
        
        return mysqli_insert_id($this->db);
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBand(int $id): ?array
    {
        $query = "SELECT * FROM mrm_bands WHERE id = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }
        
        return mysqli_fetch_assoc($result);
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandName(int $id): ?string
    {
        $query = "SELECT name FROM mrm_bands WHERE id = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['name'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function deleteBand(int $id): bool
    {
        $id = intval($id);
        $update = "DELETE FROM mrm_bands WHERE id = " . $id;
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * {@inheritdoc}
     */
    public function updateBand(int $id, string $name, string $url, string $pic_url, int $placement, int $seed, string $abbr, string $sponsor): bool
    {
        $name = mysqli_real_escape_string($this->db, $name);
        $url = mysqli_real_escape_string($this->db, $url);
        $pic_url = mysqli_real_escape_string($this->db, $pic_url);
        $placement = mysqli_real_escape_string($this->db, (string)$placement);
        $seed = mysqli_real_escape_string($this->db, (string)$seed);
        $abbr = mysqli_real_escape_string($this->db, $abbr);
        $sponsor = mysqli_real_escape_string($this->db, $sponsor);

        $update = "UPDATE mrm_bands SET name=\"$name\", url=\"$url\", pic_url=\"$pic_url\", " .
                 "placement=\"$placement\", seed=\"$seed\", abbr=\"$abbr\", sponsor=\"$sponsor\" " .
                 "WHERE id=" . intval($id);
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatch(int $id): ?array
    {
        $query = "SELECT * FROM mrm_matches WHERE id = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }
        
        return mysqli_fetch_assoc($result);
    }
    
    /**
     * {@inheritdoc}
     */
    public function updateSponsor(int $matchId, string $sponsor, string $sponsorMsg): bool
    {
        $matchId = intval($matchId);
        $sponsor = mysqli_real_escape_string($this->db, $sponsor);
        $sponsorMsg = mysqli_real_escape_string($this->db, $sponsorMsg);

        $update = "UPDATE mrm_matches SET sponsor=\"$sponsor\", sponsor_msg=\"$sponsorMsg\" WHERE id=" . $matchId;
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * {@inheritdoc}
     */
    public function vote(int $matchId, int $bandNumber, bool $bypassIpCheck = false): bool
    {
        $matchId = intval($matchId);
        $bandNumber = intval($bandNumber);
        
        if ($bandNumber !== 1 && $bandNumber !== 2) {
            return false;
        }

        $band = "band" . $bandNumber . "_votes";
        $bandId = "band" . $bandNumber . "_id";

        $query = "SELECT " . $bandId . ", " . $band . ", end_time FROM mrm_matches WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return false;
        }
        
        $info = mysqli_fetch_assoc($result);
        $matchEndTime = $info["end_time"];
        $matchHasPassed = strtotime($matchEndTime) < time();

        // If match has passed and we're not bypassing checks, don't allow vote
        if ($matchHasPassed && !$bypassIpCheck) {
            return false;
        }

        // Admin votes always go through
        if ($bypassIpCheck || !$this->hasVoted($matchId)) {
            $update = "UPDATE mrm_matches SET " . $band . " = " . ($info[$band] + 1) . " WHERE id = " . $matchId;
            $result = mysqli_query($this->db, $update);
            
            if (!$result) {
                return false;
            }
            
            // Record the vote in the database if not bypassing IP check
            if (!$bypassIpCheck) {
                $votedBand = $info[$bandId];
                $this->recordVote($matchId, $votedBand);
            }
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Record a vote in the database
     * 
     * @param int $matchId Match ID
     * @param int $bandId Band ID
     * @return bool True on success, false on failure
     */
    private function recordVote(int $matchId, int $bandId): bool
    {
        $auth0 = $GLOBALS['auth0'] ?? null;
        
        if (!$auth0) {
            return false;
        }
        
        $userInfo = $auth0->getUser();
        
        if (!$userInfo) {
            return false;
        }
        
        $email = mysqli_real_escape_string($this->db, $userInfo['email']);
        $ip = mysqli_real_escape_string($this->db, $_SERVER['REMOTE_ADDR']);
        $insert = "INSERT INTO mrm_votes VALUES (id, " . $matchId . ", " . $bandId . ", '" . $ip . "', '" . $email . "')";
        $result = mysqli_query($this->db, $insert);

        return (bool)$result;
    }
    
    /**
     * Check if a user has already voted for a match
     * 
     * @param int $matchId The match ID
     * @return bool True if the user has voted, false otherwise
     */
    private function hasVoted(int $matchId): bool
    {
        $auth0 = $GLOBALS['auth0'] ?? null;
        
        if (!$auth0) {
            return false;
        }
        
        $userInfo = $auth0->getUser();
        
        if (!$userInfo) {
            return false;
        }
        
        $email = mysqli_real_escape_string($this->db, $userInfo['email']);
        $query = "SELECT id FROM mrm_votes WHERE match_id = " . $matchId . " AND email = '" . $email . "'";
        $result = mysqli_query($this->db, $query);
        
        return ($result && mysqli_num_rows($result) > 0);
    }
    
    /**
     * {@inheritdoc}
     */
    public function closeMatch(int $matchId)
    {
        $matchId = intval($matchId);
        
        // Set the winner
        $winnerId = $this->setWinner($matchId);
        
        if (!$winnerId) {
            return false;
        }
        
        // Enable score display
        $this->enableScore($matchId);
        
        // Setup next match if not the final match
        if ($matchId < 63) {
            $this->setupNextMatch($matchId, $winnerId);
        }
        
        return $winnerId;
    }
    
    /**
     * Set the winner of a match
     * 
     * @param int $matchId Match ID
     * @return int|false The winner ID on success, false on failure
     */
    private function setWinner(int $matchId)
    {
        $query = "SELECT band1_id, band2_id, band1_votes, band2_votes FROM mrm_matches WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return false;
        }

        $info = mysqli_fetch_assoc($result);
        $winner = ($info['band1_votes'] > $info['band2_votes']) ? $info['band1_id'] : $info['band2_id'];

        $update = "UPDATE mrm_matches SET winner_id = " . $winner . " WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $update);

        if (!$result) {
            return false;
        }
        
        return $winner;
    }
    
    /**
     * Enable score display for a match
     * 
     * @param int $matchId Match ID
     * @return bool True on success, false on failure
     */
    private function enableScore(int $matchId): bool
    {
        $update = "UPDATE mrm_matches SET show_score = true WHERE id = " . $matchId;
        $result = mysqli_query($this->db, $update);
        
        return (bool)$result;
    }
    
    /**
     * Setup the next match with the winner
     * 
     * @param int $lastMatchId Last match ID
     * @param int $winnerId Winner ID
     * @return bool True on success, false on failure
     */
    private function setupNextMatch(int $lastMatchId, int $winnerId): bool
    {
        $newMatch = $this->getNewMatch($lastMatchId);
        
        if (!$newMatch) {
            return false;
        }
        
        // Even/odd determines if it's band1 or band2
        $bandValue = $lastMatchId & 1; // 0 = even, 1 = odd
        
        if ($bandValue == 1) {
            $update = "UPDATE mrm_matches SET band1_id = " . $winnerId . " WHERE id = " . $newMatch;
        } else {
            $update = "UPDATE mrm_matches SET band2_id = " . $winnerId . " WHERE id = " . $newMatch;
        }
        
        $result = mysqli_query($this->db, $update);
        
        return (bool)$result;
    }
    
    /**
     * Get the new match ID for a given match
     * 
     * @param int $oldMatch Old match ID
     * @return int|false New match ID on success, false on failure
     */
    private function getNewMatch(int $oldMatch)
    {
        $query = "SELECT new FROM mrm_matches_flow WHERE old = " . $oldMatch;
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return false;
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['new'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function now(): string
    {
        return date("Y-m-d H:i:s", time());
    }
    
    /**
     * {@inheritdoc}
     */
    public function getCurrentMatch(): ?array
    {
        $now = $this->now();
        $select = "SELECT * FROM mrm_matches WHERE '$now' >= start_time AND '$now' < end_time";
        $result = mysqli_query($this->db, $select);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }

        return mysqli_fetch_assoc($result);
    }
    
    /**
     * {@inheritdoc}
     */
    public function calculateVotePercentage(int $val1, int $val2, string $display = 'none'): string
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
    public function getWinnerClass(int $bandId, int $matchId): string
    {
        $query = "SELECT * FROM mrm_matches WHERE id = " . intval($matchId);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return '';
        }

        $info = mysqli_fetch_assoc($result);

        if ($info['winner_id'] == 0) {
            return '';
        }

        if ($info['winner_id'] == $bandId) {
            return ' mrm_winner';
        } else {
            return ' mrm_loser';
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getMatchStatus(int $matchId): string
    {
        $query = "SELECT * FROM mrm_matches WHERE id = " . intval($matchId);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "unknown";
        }
        
        $info = mysqli_fetch_assoc($result);

        if ($this->now() > $info['end_time']) {
            return "over";
        } elseif ($this->now() > $info['start_time']) {
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
    public function getMatchesByRound(int $round): array
    {
        $query = $this->getQueryForRound($round);
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            return [];
        }
        
        $matches = [];
        while ($match = mysqli_fetch_assoc($result)) {
            $matches[] = $match;
        }
        
        return $matches;
    }
    
    /**
     * Get the SQL query for a specific round
     * 
     * @param int $round Tournament round number
     * @return string SQL query
     */
    private function getQueryForRound(int $round): string
    {
        if ($round == 1) {
            return "SELECT * FROM mrm_matches WHERE id > 0 AND ID <= 32 ORDER BY winner_id, id";
        } elseif ($round == 2) {
            return "SELECT * FROM mrm_matches WHERE id > 32 AND ID <= 48 ORDER BY winner_id, id";
        } elseif ($round == 3) {
            return "SELECT * FROM mrm_matches WHERE id > 48 AND ID <= 56 ORDER BY winner_id, id";
        } elseif ($round == 4) {
            return "SELECT * FROM mrm_matches WHERE id > 56 AND ID <= 60 ORDER BY winner_id, id";
        } elseif ($round == 5) {
            return "SELECT * FROM mrm_matches WHERE id > 60 AND ID <= 62 ORDER BY winner_id, id";
        } elseif ($round == 6) {
            return "SELECT * FROM mrm_matches WHERE id = 63";
        } else {
            return 'SELECT * FROM mrm_matches WHERE id = 0'; // Return empty result for invalid round
        }
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandNameFormatted(int $placement): string
    {
        if ($placement == 0) {
            return "TBD";
        }

        $query = "SELECT name, seed FROM mrm_bands WHERE placement = " . intval($placement);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "Unknown";
        }
        
        $info = mysqli_fetch_assoc($result);
        return "<span class='seed_size'>" . $info['seed'] . "</span> " . $info['name'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandPicUrl(int $placement): string
    {
        $query = "SELECT pic_url FROM mrm_bands WHERE placement = " . intval($placement);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "";
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['pic_url'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandUrl(int $placement): string
    {
        $query = "SELECT url FROM mrm_bands WHERE placement = " . intval($placement);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "";
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['url'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandAbbr(int $placement): string
    {
        $query = "SELECT abbr FROM mrm_bands WHERE placement = " . intval($placement);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "";
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['abbr'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function getBandSeed(int $placement): string
    {
        $query = "SELECT seed FROM mrm_bands WHERE placement = " . intval($placement);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "";
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['seed'];
    }
    
    /**
     * {@inheritdoc}
     */
    public function renderAdminScoreboard(array $match): string
    {
        $matchStatus = $this->getMatchStatus($match['id']);
        $html = '';
        
        if ($matchStatus != 'early') {
            $html = "<td id=\"band_1\" class='mrm_votes " . $this->getWinnerClass($match['band1_id'], $match["id"]) . "'>Votes: " . $match['band1_votes'] . " | " . 
                $this->calculateVotePercentage($match['band1_votes'], $match['band2_votes']) . " </td>\n
                <td></td>\n
                <td id=\"band_2\" class='mrm_votes " . $this->getWinnerClass($match['band2_id'], $match["id"]) . "'>Votes: " . $match['band2_votes'] . " | " . 
                $this->calculateVotePercentage($match['band2_votes'], $match['band1_votes']) . " </td>\n";
        }
        
        return $html;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getCountdownValues(int $matchId): ?array
    {
        $query = "SELECT HOUR(TIMEDIFF(end_time, now())) as hr, MINUTE(TIMEDIFF(end_time, now())) as min, SECOND(TIMEDIFF(end_time, now())) as sec FROM mrm_matches WHERE id = " . intval($matchId);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return null;
        }

        return mysqli_fetch_assoc($result);
    }
}
