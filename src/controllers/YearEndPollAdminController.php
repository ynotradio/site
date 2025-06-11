<?php
// filepath: /workspaces/site/src/controllers/YearEndPollAdminController.php

namespace YNotRadio\Controllers;

use YNotRadio\Models\YearEndPollFactory;

require_once(__DIR__ . "/../models/YearEndPollFactory.php");

/**
 * Admin Controller for Year End Poll functionality
 * Handles admin-specific operations for the Year End Poll
 */
class YearEndPollAdminController
{
    private $pollModel;
    
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
        
        // Initialize the model
        $this->pollModel = YearEndPollFactory::create($db);
    }
    
    /**
     * Get all poll names/categories
     * 
     * @return array List of poll names
     */
    public function getPollNames(): array
    {
        return $this->pollModel->getPollNames();
    }
    
    /**
     * Format a poll name for display
     * 
     * @param string $pollName The poll name to format
     * @return string Formatted poll name
     */
    public function formatPollName(string $pollName): string
    {
        return $this->pollModel->formatPollName($pollName);
    }
    
    /**
     * Render all poll results
     * 
     * @param string $pollName The poll name to show results for
     * @return void
     */
    public function renderPollResults(string $pollName): void
    {
        // Get column names for table headers
        $columnNames = $this->pollModel->getColumnNames($pollName);
        
        // Get poll results ordered by votes
        $pollResults = $this->pollModel->getPollResults($pollName);
        
        // Pass the controller to the partial
        $controller = $this;
        
        // Include the partial to render the results
        include(__DIR__ . "/../partials/admin/_year_end_poll_results.php");
    }
    
    /**
     * Render all write-ins for a poll
     * 
     * @param string $pollName The poll name to show write-ins for
     * @return void
     */
    public function renderPollWriteIns(string $pollName): void
    {
        // Get all write-ins for the poll
        $writeIns = $this->pollModel->getWriteInsForPoll($pollName);
        
        // Pass the controller to the partial
        $controller = $this;
        
        // Include the partial to render the write-ins
        include(__DIR__ . "/../partials/admin/_year_end_poll_write_ins.php");
    }
    
    /**
     * Render all contestants
     * 
     * @return void
     */
    public function renderContestants(): void
    {
        // Get all contestants
        $contestants = $this->pollModel->getAllContestEntries();
        
        // Pass the controller to the partial
        $controller = $this;
        
        // Include the partial to render the contestants
        include(__DIR__ . "/../partials/admin/_year_end_poll_contestants.php");
    }
    
    /**
     * Render a contestant's song picks
     * 
     * @param int $contestantId The contestant ID
     * @return void
     */
    public function renderContestantSongPicks(int $contestantId): void
    {
        // Get contestant info
        $contestant = $this->pollModel->getContestantById($contestantId);
        
        if (!$contestant) {
            echo "<div class='error'>Contestant not found</div>";
            return;
        }
        
        // Get contestant's song votes
        $songVotes = $this->pollModel->getContestantSongVotes($contestant['ip_address']);
        
        if (!$songVotes) {
            echo "<div class='error'>No song votes found for this contestant</div>";
            return;
        }
        
        // Pass the controller to the partial
        $controller = $this;
        
        // Include the partial to render the song picks
        include(__DIR__ . "/../partials/admin/_year_end_poll_song_picks.php");
    }
    
    /**
     * Get a song by ID
     * 
     * @param int $songId The song ID
     * @return array|null Song data or null if not found
     */
    public function getSong(int $songId): ?array
    {
        // First, check if it's a numeric ID (from the database)
        if (is_numeric($songId)) {
            $query = "SELECT * FROM year_end_songs WHERE id = ?";
            $stmt = $this->pollModel->getDb()->prepare($query);
            $stmt->bind_param('i', $songId);
            $stmt->execute();
            
            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                return null;
            }
            
            return $result->fetch_assoc();
        }
        
        // If not numeric, it's a write-in
        return null;
    }
}
