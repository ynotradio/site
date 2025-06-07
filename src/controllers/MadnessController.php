<?php

namespace YNotRadio\Controllers;

/**
 * Controller for Modern Rock Madness functionality
 * Handles business logic and coordinates between models and views
 */
class MadnessController
{
    private $mrmModel;
    
    public function __construct($mrmModel)
    {
        if (!$mrmModel) {
            throw new \InvalidArgumentException('MRM Model is required');
        }
        $this->mrmModel = $mrmModel;
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
}
