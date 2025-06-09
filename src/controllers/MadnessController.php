<?php

namespace YNotRadio\Controllers;

use YNotRadio\Models\ModernRockMadnessFactory;

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
     * Get the tournament year
     * 
     * @param string|null $tournament_date Tournament start date
     * @return string The tournament year
     */
    public function getTournamentYear($tournament_date = null)
    {
        return $this->mrmModel->getTournamentYear($tournament_date);
    }
}
