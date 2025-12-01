<?php

// filepath: /workspaces/site/src/models/implementations/SqlYearEndPoll.php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\YearEndPoll;

/**
 * SQL implementation of the Year End Poll interface
 */
class SqlYearEndPoll implements YearEndPoll
{
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
     * Get the database connection
     * 
     * @return \mysqli The database connection
     */
    public function getDb(): \mysqli
    {
        return $this->db;
    }

    /**
     * {@inheritdoc}
     */
    public function getPollNames(): array
    {
        return array('songs', 'albums', 'artists', 'concerts', 'new_artists', 'philly_artists',
            'most_anticipated_albums', 'tv_dramas', 'tv_comedies',
            'best_movies', 'worst_movies', 'unnecessary_sequels');
    }

    /**
     * {@inheritdoc}
     */
    public function getPollValues(string $pollName): array
    {
        $columns = $this->getColumnNames($pollName);

        /* 
        conditionally strip "The" from the column to be used for sorting
        */
        $query = "SELECT *, CASE WHEN ". $columns[1] ." LIKE 'The %' 
                 THEN trim(substr(". $columns[1] ." from 4)) 
                 ELSE ". $columns[1] ." END as sortable_". $columns[1] ." 
                 FROM year_end_" . $pollName . " 
                 ORDER BY sortable_" . $columns[1];
        
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \Exception('Error fetching poll values: ' . mysqli_error($this->db));
        }

        $values = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $values[] = $row;
        }

        return $values;
    }

    /**
     * {@inheritdoc}
     */
    public function hasVoted(string $ip, string $pollName): bool
    {
        $query = "SELECT * FROM year_end_ips WHERE ip_address = ? AND poll = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('ss', $ip, $pollName);
        $stmt->execute();
        $result = $stmt->get_result();
        $info = $result->fetch_assoc();
        
        return ($info && isset($info['ip_address']));
    }

    /**
     * {@inheritdoc}
     */
    public function addVotes(string $pollName, array $votes): bool
    {
        foreach ($votes as $value) {
            $update = "UPDATE year_end_" . $pollName . " SET votes = votes + 1 WHERE id = ?";
            $stmt = $this->db->prepare($update);
            $stmt->bind_param('i', $value);
            $result = $stmt->execute();

            if (!$result) {
                throw new \Exception('Error adding votes: ' . $stmt->error);
            }
        }
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function addWriteInVote(string $ip, string $pollName, string $writeInValue): bool
    {
        $query = "INSERT INTO year_end_write_ins (ip_address, poll, write_in) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('sss', $ip, $pollName, $writeInValue);
        $result = $stmt->execute();

        if (!$result) {
            throw new \Exception('Error adding write-in vote: ' . $stmt->error);
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function recordVoterIp(string $ip, string $pollName): bool
    {
        $query = "INSERT INTO year_end_ips (ip_address, poll) VALUES (?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('ss', $ip, $pollName);
        $result = $stmt->execute();

        if (!$result) {
            throw new \Exception('Error recording voter IP: ' . $stmt->error);
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function addSongVotes(string $ip, array $votes, string $writeInValue = ''): bool
    {
        $lastValue = ($writeInValue != '') ? $writeInValue : $votes[19];

        $query = "INSERT INTO year_end_song_votes VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('sssssssssssssssssssss',
            $ip,
            $votes[0], $votes[1], $votes[2], $votes[3], $votes[4],
            $votes[5], $votes[6], $votes[7], $votes[8], $votes[9],
            $votes[10], $votes[11], $votes[12], $votes[13], $votes[14],
            $votes[15], $votes[16], $votes[17], $votes[18],
            $lastValue
        );
        
        $result = $stmt->execute();

        if (!$result) {
            throw new \Exception('Error adding song votes: ' . $stmt->error);
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function formatPollHeader(string $pollName, string $category): string
    {
        $category = str_replace('Tv', 'TV', $category);
        $category = ($pollName == 'unnecessary_sequels') ? $category . ' or Reboots ' : $category;
        $saddest = ($pollName == 'celebrity_deaths') ? ' Saddest ' : '';
        $suffix = ($pollName != 'most_anticipated_albums') ? ' of this Year' : ' for next Year';

        return "Vote for Your Top <span id=\"max_pick\">" . $this->getMaxPicks($pollName) . "</span> " . $saddest . $category . $suffix;
    }

    /**
     * {@inheritdoc}
     */
    public function formatPollName(string $pollName): string
    {
        if ($pollName == 'most_anticipated_albums') {
            $pollName = 'most_anticipated_' . (date('Y') + 1) . '_albums';
        }

        return str_replace("_", " ", $pollName);
    }

    /**
     * {@inheritdoc}
     */
    public function getMaxPicks(string $pollName): int
    {
        $maxPicks = array(
            "songs" => 20,
            "albums" => 10,
            "artists" => 5,
            "new_artists" => 3,
            "philly_artists" => 5,
            "concerts" => 2,
            "music_videos" => 2,
            "biggest_comebacks" => 2,
            "most_anticipated_albums" => 2,
            "tv_dramas" => 3,
            "tv_comedies" => 3,
            "late_night_tv" => 2,
            "best_movies" => 3,
            "worst_movies" => 2,
            "unnecessary_sequels" => 2,
            "celebrity_deaths" => 3
        );

        return $maxPicks[$pollName] ?? 3; // Default to 3 if not specified
    }

    /**
     * {@inheritdoc}
     */
    public function getColumnNames(string $pollName): array
    {
        $describe = mysqli_query($this->db, 'DESCRIBE year_end_' . $pollName);
        if (!$describe) {
            throw new \Exception('Error getting column names: ' . mysqli_error($this->db));
        }
        
        $columnNames = array();
        while ($info = mysqli_fetch_assoc($describe)) {
            $columnNames[] = $info['Field'];
        }

        return $columnNames;
    }

    /**
     * {@inheritdoc}
     */
    public function canEnterContest(string $ip): bool
    {
        $answer = true;
        $neededPolls = array('songs', 'albums', 'artists', 'new_artists', 'philly_artists',
            'most_anticipated_albums');

        foreach ($neededPolls as $poll) {
            $answer = $answer && $this->hasVoted($ip, $poll);
        }
        
        return $answer;
    }

    /**
     * {@inheritdoc}
     */
    public function hasEnteredContest(string $ip): bool
    {
        $query = "SELECT ip_address FROM year_end_contestants WHERE ip_address = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $ip);
        $stmt->execute();
        $result = $stmt->get_result();
        $info = $result->fetch_assoc();
        
        return ($info && $info['ip_address'] == $ip);
    }

    /**
     * {@inheritdoc}
     */
    public function addContestant(array $contestantData, string $ip): bool
    {
        $query = "INSERT INTO year_end_contestants (name, email, phone, hometown, contest, newsletter, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('sssssss',
            $contestantData['name'],
            $contestantData['email'],
            $contestantData['phone'],
            $contestantData['hometown'],
            $contestantData['contest'],
            $contestantData['newsletter'],
            $ip
        );

        $result = $stmt->execute();

        if (!$result) {
            throw new \Exception('Error adding contestant: ' . $stmt->error);
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getAllContestEntries(): array
    {
        $query = "SELECT * FROM year_end_contestants";
        $result = $this->db->query($query);
        
        if (!$result) {
            throw new \Exception('Error fetching contestants: ' . $this->db->error);
        }
        
        $entries = [];
        while ($row = $result->fetch_assoc()) {
            $entries[] = $row;
        }
        
        return $entries;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getContestantById(int $contestantId): ?array
    {
        $query = "SELECT * FROM year_end_contestants WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('i', $contestantId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            return null;
        }
        
        return $result->fetch_assoc();
    }
    
    /**
     * {@inheritdoc}
     */
    public function getContestantSongVotes(string $ipAddress): ?array
    {
        $query = "SELECT * FROM year_end_song_votes WHERE ip_address = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $ipAddress);
        $stmt->execute();
        
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            return null;
        }
        
        return $result->fetch_assoc();
    }
    
    /**
     * {@inheritdoc}
     */
    public function getPollResults(string $pollName): array
    {
        $columns = $this->getColumnNames($pollName);
        
        $query = "SELECT * FROM year_end_" . $pollName . " ORDER BY votes DESC, " . $columns[1] . " ASC";
        $result = $this->db->query($query);
        
        if (!$result) {
            throw new \Exception('Error fetching poll results: ' . $this->db->error);
        }
        
        $results = [];
        while ($row = $result->fetch_assoc()) {
            $results[] = $row;
        }
        
        return $results;
    }
    
    /**
     * {@inheritdoc}
     */
    public function getWriteInsForPoll(string $pollName): array
    {
        $query = "SELECT * FROM year_end_write_ins WHERE poll = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $pollName);
        $stmt->execute();
        
        $result = $stmt->get_result();
        if (!$result) {
            throw new \Exception('Error fetching write-ins: ' . $stmt->error);
        }
        
        $writeIns = [];
        while ($row = $result->fetch_assoc()) {
            $writeIns[] = $row;
        }
        
        return $writeIns;
    }
}
