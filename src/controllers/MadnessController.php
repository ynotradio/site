<?php

namespace YNotRadio\Controllers;

use YNotRadio\Models\ModernRockMadnessFactory;

require_once(__DIR__ . "/../models/ModernRockMadnessFactory.php");

/**
 * Controller for Modern Rock Madness functionality
 * Handles business logic and coordinates between models and views
 */
class MadnessController
{
    private $mrmModel;
    
    /**
     * Create controller with database connection
     * 
     * @param \mysqli $db Database connection
     * @throws \Exception If model creation fails
     */
    public function __construct(\mysqli $db)
    {
        if (!$db) {
            throw new \InvalidArgumentException('Database connection is required');
        }
        
        // Initialize the model internally
        $this->mrmModel = ModernRockMadnessFactory::create($db);
    }
    
    /**
     * Get champion data for display
     * 
     * @param string|null $tournament_date
     * @return array|null Champion data with name, pic_url, and year, or null if no champion yet
     */
    public function getChampionData($tournament_date = null)
    {
        $champion = $this->mrmModel->getChampion();
        
        if ($champion === null) {
            return null; // No champion yet - tournament not finished
        }
        
        return [
            'name' => $champion['name'],
            'pic_url' => $champion['pic_url'],
            'year' => $this->mrmModel->getTournamentYear($tournament_date)
        ];
    }
    
    /**
     * Check if tournament is over
     * 
     * @return bool
     */
    public function isTournamentOver()
    {
        return $this->mrmModel->isTournamentOver();
    }
    
    /**
     * Check if waiting for final results
     * 
     * @return bool
     */
    public function isWaitingForFinal()
    {
        return $this->mrmModel->isWaitingForFinal();
    }
    
    /**
     * Determine what content should be displayed in the first row
     * Returns an array with the content type and any necessary data
     * 
     * @param string|null $tournament_date
     * @return array Content configuration: ['type' => 'champion|waiting|next_match', 'data' => mixed]
     */
    public function getFirstRowContent($tournament_date = null)
    {
        if ($this->isTournamentOver()) {
            $championData = $this->getChampionData($tournament_date);
            return [
                'type' => 'champion',
                'data' => $championData
            ];
        } elseif ($this->isWaitingForFinal()) {
            return [
                'type' => 'waiting',
                'data' => null
            ];
        } else {
            return [
                'type' => 'next_match',
                'data' => $tournament_date
            ];
        }
    }
    
    /**
     * Get current match data
     * 
     * @return array|null Current match data
     */
    public function getCurrentMatch()
    {
        return $this->mrmModel->getCurrentMatch();
    }
    
    /**
     * Process a vote submission
     * 
     * @param int|null $match_id The match ID
     * @param int|null $band_id The band ID (1 or 2)
     * @param string|null $voter_email The voter's email address
     * @return bool Whether vote was processed
     */
    public function processVote($match_id, $band_id, $voter_email = null)
    {
        if (!$match_id || !$band_id) {
            return false;
        }
        
        // Get voter email from Auth0 if not provided
        if (!$voter_email) {
            $auth0 = $GLOBALS['auth0'] ?? null;
            if ($auth0) {
                $userInfo = $auth0->getUser();
                $voter_email = $userInfo['email'] ?? '';
            }
        }
        
        if (empty($voter_email)) {
            return false; // Cannot vote without email
        }
        
        // Get voter IP
        $voter_ip = $_SERVER['REMOTE_ADDR'] ?? '';
        
        try {
            // Use the model's recordVote method
            return $this->mrmModel->recordVote($match_id, $band_id, $voter_email, $voter_ip);
        } catch (\Exception $e) {
            error_log("Vote Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if champion should be displayed
     * 
     * @param string|null $tournament_date
     * @return bool
     */
    public function shouldDisplayChampion($tournament_date = null)
    {
        return $this->isTournamentOver() && $this->getChampionData($tournament_date) !== null;
    }
    
    /**
     * Render vote form for a match and band
     * 
     * @param int $match_id The match ID
     * @param int $band_id The band ID (1 or 2)
     * @return string HTML for the vote form
     */
    public function renderVoteForm($match_id, $band_id)
    {
        // Check if match is open for voting
        $match = $this->mrmModel->getMatch($match_id);
        if (!$match) {
            return '<div class="vote-error">Match not found</div>';
        }
        
        $match_status = $this->mrmModel->getMatchStatus($match_id);
        if ($match_status !== 'running') {
            return '<div class="vote-closed">Voting is closed</div>';
        }
        
        // Capture output buffer to return the form as a string
        ob_start();
        include __DIR__ . '/../partials/_mrm_vote_form.php';
        return ob_get_clean();
    }
    
    /**
     * Check if user has already voted in a match
     * 
     * @param int $match_id The match ID
     * @param string|null $voter_email The voter's email (optional)
     * @return bool True if already voted
     */
    public function hasVoted($match_id, $voter_email = null)
    {
        // Get voter email from Auth0 if not provided
        if (!$voter_email) {
            $auth0 = $GLOBALS['auth0'] ?? null;
            if ($auth0) {
                $userInfo = $auth0->getUser();
                $voter_email = $userInfo['email'] ?? '';
            }
        }
        
        if (empty($voter_email)) {
            return false; // Can't check without email
        }
        
        return $this->mrmModel->hasVoted($match_id, $voter_email);
    }
    
    /**
     * Render the match display using the partial
     * 
     * @param int $match_id The match ID to display
     * @param string|null $tournament_date The tournament start date
     * @return void
     */
    public function renderMatchDisplay($match_id, $tournament_date = null)
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_mrm_match_display.php';
    }
    
    /**
     * Render the bracket display using the partial
     * 
     * @param string|null $tournament_date The tournament start date
     * @return void
     */
    public function renderBracketDisplay($tournament_date = null)
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_mrm_bracket_display.php';
    }
    
    /**
     * Render the next match display using the partial
     * 
     * @param string|null $tournament_date The tournament start date
     * @return void
     */
    public function renderNextMatchDisplay($tournament_date = null)
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_mrm_next_match.php';
    }
    
    /**
     * Render the match scoreboard
     * 
     * @param array $match The match data
     * @return void
     */
    public function renderScoreboard(array $match): void
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_mrm_scoreboard.php';
    }
    
    /**
     * Render countdown values for a match
     * 
     * @param array $match The match data
     * @return void
     */
    public function renderCountdownValues(array $match): void
    {
        include __DIR__ . '/../partials/_mrm_countdown_values.php';
    }
    
    /**
     * Render tournament timeline
     * 
     * @param string|null $tournament_date The tournament start date
     * @return void
     */
    public function renderTournamentTimeline(?string $tournament_date = null): void
    {
        $timeline = $this->mrmModel->getTimelineData($tournament_date ?? date('Y-m-d'));
        
        // Display tournament timeline
        echo "<ul class='mrm-timeline' id='time_line'>\n";

        // Left side of the bracket (first to championship)
        echo "<li><strong>1<sup>st</sup> ROUND</strong>{$timeline['first_round_left']}</li>\n";
        echo "<li><strong>2<sup>nd</sup> ROUND</strong>{$timeline['second_round_left']}</li>\n";
        echo "<li class=\"top-pad_3\"><strong>SWELL 16</strong>{$timeline['sweet_16']}</li>\n";
        echo "<li class=\"top-pad_3\"><strong>ELUSIVE 8</strong>{$timeline['elusive_8']}</li>\n";
        echo "<li class=\"top-pad_3\"><strong>FANTASTIC 4</strong>{$timeline['final_4']}</li>\n";

        // Championship (center)
        echo "<li class=\"top-pad_3\"><strong>CHAMPION</strong>{$timeline['championship']}</li>\n";

        // Right side of the bracket (championship to first)
        echo "<li class=\"top-pad_3\"><strong>FANTASTIC 4</strong>{$timeline['final_4']}</li>\n";
        echo "<li class=\"top-pad_3\"><strong>ELUSIVE 8</strong>{$timeline['elusive_8']}</li>\n";
        echo "<li class=\"top-pad_3\"><strong>SWELL 16</strong>{$timeline['sweet_16']}</li>\n";
        echo "<li><strong>2<sup>nd</sup> ROUND</strong>{$timeline['second_round_right']}</li>\n";
        echo "<li><strong>1<sup>st</sup> ROUND</strong>{$timeline['first_round_right']}</li>\n";

        // Close the timeline
        echo "</ul>\n";
    }
    
    /**
     * Get the tournament year
     * 
     * @param string|null $tournament_date Tournament start date
     * @return string The tournament year
     */
    public function getTournamentYear($tournament_date = null)
    {
        return $this->mrmModel->getTournamentYear($tournament_date);
    }
    
    /**
     * Get winner class for band in match
     * 
     * @param int $bandId The band ID to check
     * @param int $matchId The match ID to check
     * @return string CSS class for the band
     */
    public function getWinnerClass(int $bandId, int $matchId): string
    {
        return $this->mrmModel->getWinnerClass($bandId, $matchId);
    }
    
    /**
     * Check if match is tied
     * 
     * @param array $match The match data
     * @return bool True if tied
     */
    public function isMatchTied(array $match): bool
    {
        return $this->mrmModel->isMatchTied($match);
    }
    
    /**
     * Get sponsor info for a match
     * 
     * @param int|null $matchId Optional match ID
     * @return array|null Sponsor info
     */
    public function getSponsorInfo(?int $matchId = null): ?array
    {
        return $this->mrmModel->getSponsorInfo($matchId);
    }
    
    /**
     * Render sponsor information if available
     * 
     * @param int|null $matchId Optional match ID
     * @return void
     */
    public function renderSponsorInfo(?int $matchId = null): void
    {
        $sponsorInfo = $this->getSponsorInfo($matchId);
        
        if (!$sponsorInfo) {
            return;
        }
        
        include __DIR__ . '/../partials/_mrm_sponsor_info.php';
    }
    
    /**
     * Render champion banner
     * 
     * @param string|null $tournament_date Tournament start date
     * @return void
     */
    public function renderChampionBanner(?string $tournament_date = null): void
    {
        if (!$this->shouldDisplayChampion($tournament_date)) {
            return;
        }
        
        $championData = $this->getChampionData($tournament_date);
        include __DIR__ . '/../partials/_mrm_champion_banner.php';
    }
}
