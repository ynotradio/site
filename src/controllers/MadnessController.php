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
            'year' => get_tournament_year($tournament_date)
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
     * @param int|null $match_id
     * @param int|null $band_id
     * @return bool Whether vote was processed
     */
    public function processVote($match_id, $band_id)
    {
        if (!$match_id || !$band_id) {
            return false;
        }
        
        // This would call the legacy vote function for now
        // In a future refactor, this logic would be moved to the model
        return vote($match_id, $band_id, false);
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
}
