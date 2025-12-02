<?php

// filepath: /workspaces/site/src/controllers/YearEndPollController.php

namespace YNotRadio\Controllers;

use YNotRadio\Models\YearEndPollFactory;

require_once(__DIR__ . "/../models/YearEndPollFactory.php");

/**
 * Controller for Year End Poll functionality
 * Handles business logic and coordinates between models and views
 */
class YearEndPollController
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
     * Get values for a specific poll
     * 
     * @param string $pollName The poll name
     * @return array Poll values/options
     */
    public function getPollValues(string $pollName): array
    {
        return $this->pollModel->getPollValues($pollName);
    }
    
    /**
     * Check if user has voted in a poll
     * 
     * @param string $ip The user's IP address
     * @param string $pollName The poll name
     * @return bool True if voted
     */
    public function hasVoted(string $ip, string $pollName): bool
    {
        return $this->pollModel->hasVoted($ip, $pollName);
    }
    
    /**
     * Format a poll name for display
     * 
     * @param string $pollName The poll name
     * @return string Formatted name
     */
    public function formatPollName(string $pollName): string
    {
        return $this->pollModel->formatPollName($pollName);
    }
    
    /**
     * Get the CSS class for a poll based on voting status
     * 
     * @param string $ip The user's IP address
     * @param string $pollName The poll name
     * @param string|null $currentPoll The currently active poll
     * @return string CSS class(es)
     */
    public function getPollClass(string $ip, string $pollName, ?string $currentPoll = null): string
    {
        $class = 'poll';

        if ($this->hasVoted($ip, $pollName)) {
            $class .= ' completed ';
        }

        if ($pollName === $currentPoll) {
            $class .= ' current';
        }

        return $class;
    }
    
    /**
     * Create a link for a poll
     * 
     * @param string $ip The user's IP address
     * @param string $pollName The poll name
     * @return string Link URL
     */
    public function createPollLink(string $ip, string $pollName): string
    {
        return ($this->hasVoted($ip, $pollName)) ? "yearendpoll.php" : "yearendpoll.php?poll=" . $pollName;
    }
    
    /**
     * Process votes for a poll
     * 
     * @param string $pollName The poll name
     * @param array $votes The vote option IDs
     * @param string $ip The voter's IP address
     * @param string $writeInValue Optional write-in value
     * @return bool True if votes were processed
     */
    public function processVotes(string $pollName, array $votes, string $ip, string $writeInValue = ''): bool
    {
        try {
            // Record the votes for the poll options
            $this->pollModel->addVotes($pollName, $votes);
            
            // Special handling for song votes
            if ($pollName === 'songs') {
                $this->pollModel->addSongVotes($ip, $votes, $writeInValue);
            }
            
            // Record write-in if provided
            if (!empty($writeInValue)) {
                $this->pollModel->addWriteInVote($ip, $pollName, $writeInValue);
            }
            
            // Record that this IP has voted in this poll
            $this->pollModel->recordVoterIp($ip, $pollName);
            
            return true;
        } catch (\Exception $e) {
            error_log("Vote Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if the user can enter the contest
     * 
     * @param string $ip The user's IP address
     * @return bool True if can enter
     */
    public function canEnterContest(string $ip): bool
    {
        return $this->pollModel->canEnterContest($ip);
    }
    
    /**
     * Check if user has already entered the contest by IP
     *
     * @param string $ip The user's IP address
     * @return bool True if already entered
     */
    public function hasEnteredContest(string $ip): bool
    {
        return $this->pollModel->hasEnteredContest($ip);
    }

    /**
     * Check if email has already been used to enter the contest
     *
     * @param string $email The email address to check
     * @return bool True if email already used
     */
    public function hasEnteredContestByEmail(string $email): bool
    {
        return $this->pollModel->hasEnteredContestByEmail($email);
    }

    /**
     * Check if phone number has already been used to enter the contest
     *
     * @param string $phone The phone number to check
     * @return bool True if phone already used
     */
    public function hasEnteredContestByPhone(string $phone): bool
    {
        return $this->pollModel->hasEnteredContestByPhone($phone);
    }

    /**
     * Process a contest entry
     * 
     * @param array $contestantData Contestant data
     * @param string $ip The contestant's IP address
     * @return bool True if entry was processed
     */
    public function processContestEntry(array $contestantData, string $ip): bool
    {
        try {
            return $this->pollModel->addContestant($contestantData, $ip);
        } catch (\Exception $e) {
            error_log("Contest Entry Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Render poll dashboard using partial
     * 
     * @param string $ip The user's IP address
     * @param string|null $currentPoll Current poll name
     * @return void
     */
    public function renderPollDashboard(string $ip, ?string $currentPoll = null): void
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_year_end_poll_dashboard.php';
    }
    
    /**
     * Render poll voting form using partial
     * 
     * @param string $pollName The poll name
     * @return void
     */
    public function renderPollVoteForm(string $pollName): void
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_year_end_poll_vote.php';
    }
    
    /**
     * Render contest entry form using partial
     * 
     * @return void
     */
    public function renderContestEntryForm(): void
    {
        $controller = $this; // For use in the partial
        include __DIR__ . '/../partials/_year_end_poll_form.php';
    }
    
    /**
     * Get column names for a poll
     * 
     * @param string $pollName The poll name
     * @return array Column names
     */
    public function getColumnNames(string $pollName): array
    {
        return $this->pollModel->getColumnNames($pollName);
    }
    
    /**
     * Format the poll header
     * 
     * @param string $pollName The poll name
     * @param string $category The category name
     * @return string Formatted header
     */
    public function formatPollHeader(string $pollName, string $category): string
    {
        return $this->pollModel->formatPollHeader($pollName, $category);
    }
    
    /**
     * Get max picks for a poll
     * 
     * @param string $pollName The poll name
     * @return int Max picks
     */
    public function getMaxPicks(string $pollName): int
    {
        return $this->pollModel->getMaxPicks($pollName);
    }
}
