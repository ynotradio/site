<?php

namespace YNotRadio\Controllers;

use YNotRadio\Models\ModernRockMadnessAdmin;
use YNotRadio\Models\ModernRockMadnessAdminFactory;

require_once(__DIR__ . "/../models/ModernRockMadnessAdminFactory.php");

/**
 * Controller for Modern Rock Madness admin functionality
 * Handles business logic for administration of MRM tournament
 */
class MadnessAdminController
{
    private $db;
    private $mrmController;
    private $mrmAdmin;
    
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
        
        // Initialize the admin model using the factory
        $this->mrmAdmin = ModernRockMadnessAdminFactory::create($db);
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
        return $this->mrmAdmin->addBand($name, $url, $pic_url, $placement, $seed, $abbr, $sponsor);
    }
    
    /**
     * Get band information by ID
     * 
     * @param int $id Band ID
     * @return array|null Band information or null if not found
     */
    public function getBand($id)
    {
        return $this->mrmAdmin->getBand($id);
    }
    
    /**
     * Get band name by ID
     * 
     * @param int $id Band ID
     * @return string|null Band name or null if not found
     */
    public function getBandName($id)
    {
        return $this->mrmAdmin->getBandName($id);
    }
    
    /**
     * Delete a band by ID
     * 
     * @param int $id Band ID
     * @return bool True on success, false on failure
     */
    public function deleteBand($id)
    {
        return $this->mrmAdmin->deleteBand($id);
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
        return $this->mrmAdmin->updateBand($id, $name, $url, $pic_url, $placement, $seed, $abbr, $sponsor);
    }
    
    /**
     * Get match information by ID
     * 
     * @param int $id Match ID
     * @return array|null Match information or null if not found
     */
    public function getMatch($id)
    {
        return $this->mrmAdmin->getMatch($id);
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
        return $this->mrmAdmin->updateSponsor($matchId, $sponsor, $sponsorMsg);
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
        return $this->mrmAdmin->vote($matchId, $bandNumber, $bypassIpCheck);
    }
    
    /**
     * Close a match and set the winner
     * 
     * @param int $matchId Match ID
     * @return int|false The winner ID on success, false on failure
     */
    public function closeMatch($matchId)
    {
        return $this->mrmAdmin->closeMatch($matchId);
    }
    
    /**
     * Get the current date and time in MySQL format
     * 
     * @return string Current date and time
     */
    public function now()
    {
        return $this->mrmAdmin->now();
    }
    
    /**
     * Get the currently active match
     * 
     * @return array|null Current match information or null if no match is active
     */
    public function getCurrentMatch()
    {
        return $this->mrmAdmin->getCurrentMatch();
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
        return $this->mrmAdmin->calculateVotePercentage($val1, $val2, $display);
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
        return $this->mrmAdmin->getWinnerClass($bandId, $matchId);
    }
    
    /**
     * Get the status of a match
     * 
     * @param int $matchId Match ID
     * @return string Match status: "over", "running", or "early"
     */
    public function getMatchStatus($matchId)
    {
        return $this->mrmAdmin->getMatchStatus($matchId);
    }
    
    /**
     * Check if a match is tied
     * 
     * @param array $match Match data
     * @return bool True if the match is tied
     */
    public function isMatchTied($match)
    {
        return $this->mrmAdmin->isMatchTied($match);
    }
    
    /**
     * Get all matches for a specific round
     * 
     * @param int $round Tournament round number
     * @return array Array of match data
     */
    public function getMatchesByRound($round)
    {
        return $this->mrmAdmin->getMatchesByRound($round);
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
        return $this->mrmAdmin->getBandNameFormatted($placement);
    }
    
    /**
     * Get band picture URL
     * 
     * @param int $placement Band placement
     * @return string Picture URL
     */
    public function getBandPicUrl($placement)
    {
        return $this->mrmAdmin->getBandPicUrl($placement);
    }
    
    /**
     * Get band URL
     * 
     * @param int $placement Band placement
     * @return string Band URL
     */
    public function getBandUrl($placement)
    {
        return $this->mrmAdmin->getBandUrl($placement);
    }
    
    /**
     * Get band abbreviation
     * 
     * @param int $id Band placement
     * @return string Band abbreviation
     */
    public function getBandAbbr($id)
    {
        return $this->mrmAdmin->getBandAbbr($id);
    }
    
    /**
     * Get band seed number
     * 
     * @param int $placement Band placement
     * @return string Band seed
     */
    public function getBandSeed($placement)
    {
        return $this->mrmAdmin->getBandSeed($placement);
    }
    
    /**
     * Render the admin scoreboard for a match
     * 
     * @param array $match Match information
     * @return string HTML for the admin scoreboard
     */
    public function renderAdminScoreboard($match)
    {
        return $this->mrmAdmin->renderAdminScoreboard($match);
    }
    
    /**
     * Get countdown values for a match
     * 
     * @param int $matchId Match ID
     * @return array|null Countdown values (hr, min, sec) or null if error
     */
    public function getCountdownValues($matchId) 
    {
        return $this->mrmAdmin->getCountdownValues($matchId);
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
