<?php

namespace YNotRadio\Controllers;

/**
 * Controller for Modern Rock Madness admin functionality
 * Handles business logic for administration of MRM tournament
 */
class MadnessAdminController
{
    private $db;
    private $mrmController;
    
    /**
     * Create admin controller with database connection
     * 
     * @param \mysqli $db Database connection
     * @throws \Exception If model creation fails
     */
    public function __construct(\mysqli $db)
    {
        if (!$db) {
            throw new \InvalidArgumentException('Database connection is required');
        }
        
        $this->db = $db;
        
        // Use the main controller for some shared functionality
        $this->mrmController = new MadnessController($db);
    }
    
    /**
     * Add a new band to the tournament
     * 
     * @param string $name Band name
     * @param string $url Band URL
     * @param string $pic_url Picture URL
     * @param int $placement Band placement in bracket
     * @param int $seed Band seed
     * @param string $abbr Band name abbreviation
     * @param string $sponsor Band sponsor
     * @return int|false The inserted ID on success, false on failure
     */
    public function addBand($name, $url, $pic_url, $placement, $seed, $abbr, $sponsor)
    {
        $name = mysqli_real_escape_string($this->db, $name);
        $url = mysqli_real_escape_string($this->db, $url);
        $pic_url = mysqli_real_escape_string($this->db, $pic_url);
        $placement = mysqli_real_escape_string($this->db, $placement);
        $seed = mysqli_real_escape_string($this->db, $seed);
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
     * Get band information by ID
     * 
     * @param int $id Band ID
     * @return array|null Band information or null if not found
     */
    public function getBand($id)
    {
        $query = "SELECT * FROM mrm_bands WHERE id = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }
        
        return mysqli_fetch_assoc($result);
    }
    
    /**
     * Get band name by ID
     * 
     * @param int $id Band ID
     * @return string|null Band name or null if not found
     */
    public function getBandName($id)
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
     * Delete a band by ID
     * 
     * @param int $id Band ID
     * @return bool True on success, false on failure
     */
    public function deleteBand($id)
    {
        $id = intval($id);
        $update = "DELETE FROM mrm_bands WHERE id = " . $id;
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * Update a band's information
     * 
     * @param int $id Band ID
     * @param string $name Band name
     * @param string $url Band URL
     * @param string $pic_url Picture URL
     * @param int $placement Band placement in bracket
     * @param int $seed Band seed
     * @param string $abbr Band name abbreviation
     * @param string $sponsor Band sponsor
     * @return bool True on success, false on failure
     */
    public function updateBand($id, $name, $url, $pic_url, $placement, $seed, $abbr, $sponsor)
    {
        $name = mysqli_real_escape_string($this->db, $name);
        $url = mysqli_real_escape_string($this->db, $url);
        $pic_url = mysqli_real_escape_string($this->db, $pic_url);
        $placement = mysqli_real_escape_string($this->db, $placement);
        $seed = mysqli_real_escape_string($this->db, $seed);
        $abbr = mysqli_real_escape_string($this->db, $abbr);
        $sponsor = mysqli_real_escape_string($this->db, $sponsor);

        $update = "UPDATE mrm_bands SET name=\"$name\", url=\"$url\", pic_url=\"$pic_url\", " .
                 "placement=\"$placement\", seed=\"$seed\", abbr=\"$abbr\", sponsor=\"$sponsor\" " .
                 "WHERE id=" . intval($id);
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * Get match information by ID
     * 
     * @param int $id Match ID
     * @return array|null Match information or null if not found
     */
    public function getMatch($id)
    {
        $query = "SELECT * FROM mrm_matches WHERE id = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }
        
        return mysqli_fetch_assoc($result);
    }
    
    /**
     * Update a match's sponsor information
     * 
     * @param int $matchId Match ID
     * @param string $sponsor Sponsor name
     * @param string $sponsorMsg Sponsor message
     * @return bool True on success, false on failure
     */
    public function updateSponsor($matchId, $sponsor, $sponsorMsg)
    {
        $matchId = intval($matchId);
        $sponsor = mysqli_real_escape_string($this->db, $sponsor);
        $sponsorMsg = mysqli_real_escape_string($this->db, $sponsorMsg);

        $update = "UPDATE mrm_matches SET sponsor=\"$sponsor\", sponsor_msg=\"$sponsorMsg\" WHERE id=" . $matchId;
        $result = mysqli_query($this->db, $update);

        return (bool)$result;
    }
    
    /**
     * Cast a vote for a band in a match
     * 
     * @param int $matchId Match ID
     * @param int $bandNumber Band number (1 or 2)
     * @param bool $bypassIpCheck Whether to bypass IP check
     * @return bool True on success, false on failure
     */
    public function vote($matchId, $bandNumber, $bypassIpCheck = false)
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
        if ($bypassIpCheck || !$this->mrmController->hasVoted($matchId)) {
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
    private function recordVote($matchId, $bandId)
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
     * Close a match and set the winner
     * 
     * @param int $matchId Match ID
     * @return int|false The winner ID on success, false on failure
     */
    public function closeMatch($matchId)
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
    private function setWinner($matchId)
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
    private function enableScore($matchId)
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
    private function setupNextMatch($lastMatchId, $winnerId)
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
    private function getNewMatch($oldMatch)
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
     * Get the current date and time in MySQL format
     * 
     * @return string Current date and time
     */
    public function now()
    {
        return date("Y-m-d H:i:s", time());
    }
    
    /**
     * Get the currently active match
     * 
     * @return array|null Current match information or null if no match is active
     */
    public function getCurrentMatch()
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
     * Calculate vote percentage for display
     * 
     * @param int $val1 First vote count
     * @param int $val2 Second vote count
     * @param string $display Display mode
     * @return string Formatted percentage
     */
    public function calculateVotePercentage($val1, $val2, $display = 'none')
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
     * Get winner CSS class for a band in a match
     * 
     * @param int $bandId Band ID
     * @param int $matchId Match ID
     * @return string CSS class name
     */
    public function getWinnerClass($bandId, $matchId)
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
     * Get the status of a match
     * 
     * @param int $matchId Match ID
     * @return string Match status: "over", "running", or "early"
     */
    public function getMatchStatus($matchId)
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
     * Check if a match is tied
     * 
     * @param array $match Match data
     * @return bool True if the match is tied
     */
    public function isMatchTied($match)
    {
        return ($match['band1_votes'] == $match['band2_votes']);
    }
    
    /**
     * Get all matches for a specific round
     * 
     * @param int $round Tournament round number
     * @return array Array of match data
     */
    public function getMatchesByRound($round)
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
    private function getQueryForRound($round)
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
     * Render all matches for a specific round
     * 
     * @param int $round Tournament round number
     * @return void
     */
    public function displayMatchesByRound($round)
    {
        $matches = $this->getMatchesByRound($round);
        
        if (empty($matches)) {
            echo "<p>No matches found for round {$round}</p>";
            return;
        }
        
        foreach ($matches as $match) {
            $liveMatch = ($this->getCurrentMatch()['id'] == $match['id']) ? "id=\"live_match\"" : '';
            
            echo "<table class=\"bottom-spacer_20 table-center\"" . $liveMatch . ">\n
            <tr>\n<td class='mrm_band" . $this->getWinnerClass($match['band1_id'], $match["id"]) . "'>" . $this->getBandNameFormatted($match['band1_id']) . "</td>\n<td></td>\n<td class='mrm_band" . 
            $this->getWinnerClass($match['band2_id'], $match["id"]) . "'>" . $this->getBandNameFormatted($match['band2_id']) . "</td>\n</tr>\n" .
            "<tr>\n<td class='" . $this->getWinnerClass($match['band1_id'], $match["id"]) . "'><img src=\"" . $this->getBandPicUrl($match['band1_id']) . "\" width=\"200px\"></td>\n<td " . 
            $this->getTimerOrVs($match) . " class='middle'> VS </td>\n<td class='" . $this->getWinnerClass($match['band2_id'], $match["id"]) . "'>" . 
            "<img src=\"" . $this->getBandPicUrl($match['band2_id']) . "\" width=\"200px\"></td>\n</tr>\n";

            echo "<tr class=\"scoreboard\">";
            echo $this->renderAdminScoreboard($match);
            echo "</tr>";
            
            $this->displayVotingStatusMessage($match);
            $this->displayVotingButtons($match, $round);
            $this->displayCloseMatchButton($match, $round);
            
            echo "<tr>\n<td class=\"text-right\">Start Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['start_time'])) . "</td></tr>";
            echo "<tr>\n<td class=\"text-right\">End Time:</td><td colspan=\"2\">" . date('F d @ g:i a', strtotime($match['end_time'])) . "</td></tr>";

            echo "</table>\n";

            echo "<table class=\"bottom-spacer_20 table-center\"" . $liveMatch . ">\n
                <tr><td><strong>Match sponsored by: " . $match['sponsor'] . "</strong></td></tr>\n
                <tr><td>" . $match['sponsor_msg'] . "</td></tr>\n
                <tr><td><a href='/mrm_manage_sponsor.php?match=" . $match['id'] . "'>Edit</a></td></tr>";
            echo "</table>\n";
        }
    }
    
    /**
     * Get timer or vs display for a match
     * 
     * @param array $match Match data
     * @return string HTML id attribute
     */
    private function getTimerOrVs($match)
    {
        $currentMatch = $this->getCurrentMatch();
        return ($match['id'] == $currentMatch['id']) ? "id=\"mrm_timer\"" : '';
    }
    
    /**
     * Display voting status message for a match
     * 
     * @param array $match Match data
     * @return void
     */
    private function displayVotingStatusMessage($match)
    {
        $matchStatus = $this->getMatchStatus($match['id']);
        $message = "";

        if ($matchStatus == "early") {
            $message = "Voting has not started";
        } elseif ($matchStatus == "over" && $this->isMatchTied($match)) {
            $message = "Match is over and tied - vote for the winner";
        } elseif ($matchStatus == "over" && !$this->isMatchTied($match)) {
            $message = "Voting is now over";
        }

        echo "<tr><td colspan=\"3\" class=\"voting_message\">" . $message . "</td></tr>";
    }
    
    /**
     * Display voting buttons for a match
     * 
     * @param array $match Match data
     * @param int $round Tournament round
     * @return void
     */
    private function displayVotingButtons($match, $round)
    {
        if ($this->isMatchOpen($match)) {
            echo "<tr>";
            for ($i = 1; $i <= 2; $i++) {
                echo "<td class=\"center\">
                <form action=\"mrm_manage_matches.php\" class=\"for_band" . $i . "\" method=\"post\">
                  <input type=\"hidden\" id=\"action\" name=\"action\" value =\"write\">
                  <input type=\"hidden\" id=\"match\" name=\"match\" value =\"" . $match['id'] . "\">
                  <input type=\"hidden\" id=\"band\" name=\"band\" value =\"" . $i . "\">
                  <input type=\"hidden\" id=\"round\" name=\"round\" value =\"" . $round . "\">
                  <input type=\"submit\" class=\"vote_for_band" . $i . " btn-success\" value=\"Manual Vote\">
                  </form>\n<td>";
            }
            echo "</tr>";
        }
    }
    
    /**
     * Check if a match is open for voting
     * 
     * @param array $match Match data
     * @return bool True if the match is open
     */
    private function isMatchOpen($match)
    {
        $matchStatus = $this->getMatchStatus($match['id']);
        return ($matchStatus == "running" || ($this->isMatchTied($match) && $matchStatus == "over"));
    }
    
    /**
     * Display close match button for a match
     * 
     * @param array $match Match data
     * @param int $round Tournament round
     * @return void
     */
    private function displayCloseMatchButton($match, $round)
    {
        $matchStatus = $this->getMatchStatus($match['id']);

        if ($matchStatus == "over" && !$this->isMatchTied($match) && $match['winner_id'] == "0") {
            echo "<tr>\n<td colspan=\"3\" class=\"center\">";
            echo "<form action=\"mrm_manage_matches.php\" method=\"post\">
            <input type=\"hidden\" name=\"action\" value =\"close\">
            <input type=\"hidden\" name=\"match\" value =\"" . $match['id'] . "\">
            <input type=\"hidden\" name=\"round\" value =\"" . $round . "\">
            <input type=\"submit\" class=\"btn-danger\" value=\"Close Match\">
            </form>\n";
            echo "</td>\n</tr>";
        }
    }
    
    /**
     * Get formatted band name with seed
     * 
     * @param int $placement Band placement
     * @return string Formatted band name
     */
    public function getBandNameFormatted($placement)
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
     * Get band picture URL
     * 
     * @param int $placement Band placement
     * @return string Picture URL
     */
    public function getBandPicUrl($placement)
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
     * Get band URL
     * 
     * @param int $placement Band placement
     * @return string Band URL
     */
    public function getBandUrl($placement)
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
     * Get band abbreviation
     * 
     * @param int $id Band placement
     * @return string Band abbreviation
     */
    public function getBandAbbr($id)
    {
        $query = "SELECT abbr FROM mrm_bands WHERE placement = " . intval($id);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return "";
        }
        
        $info = mysqli_fetch_assoc($result);
        return $info['abbr'];
    }
    
    /**
     * Get band seed number
     * 
     * @param int $placement Band placement
     * @return string Band seed
     */
    public function getBandSeed($placement)
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
     * Render the admin scoreboard for a match
     * 
     * @param array $match Match information
     * @return string HTML for the admin scoreboard
     */
    public function renderAdminScoreboard($match)
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
     * Get countdown values for a match
     * 
     * @param int $matchId Match ID
     * @return array|null Countdown values (hr, min, sec) or null if error
     */
    public function getCountdownValues($matchId) 
    {
        $query = "SELECT HOUR(TIMEDIFF(end_time, now())) as hr, MINUTE(TIMEDIFF(end_time, now())) as min, SECOND(TIMEDIFF(end_time, now())) as sec FROM mrm_matches WHERE id = " . intval($matchId);
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return null;
        }

        return mysqli_fetch_assoc($result);
    }
    
    /**
     * Render countdown HTML for a match
     * 
     * @param int $matchId Match ID
     * @return void
     */
    public function renderCountdown($matchId)
    {
        $countdown_values = $this->getCountdownValues($matchId);
        
        if ($countdown_values) {
            echo "<div class=\"hidden\" id=\"hr\">" . $countdown_values['hr'] . "</div>
            <div class=\"hidden\" id=\"min\">" . $countdown_values['min'] . "</div>
            <div class=\"hidden\" id=\"sec\">" . $countdown_values['sec'] . "</div>";
        }
    }
}
