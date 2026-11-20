<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\YearEndPoll;
use PDO;

/**
 * Year End Poll backed by Payload's year_end_poll_* tables.
 *
 * Categories, nominees, max picks and page copy come from the poll Josh
 * sets up in Payload, so nothing about a given year is hardcoded here.
 * The `$ip` parameters on the interface carry the voter's Auth0 user ID.
 *
 * The CP results/contestant screens are not supported: Payload's admin
 * lists votes, write-ins and contestants directly, and FeatureManager
 * keeps /cp on MySQL anyway.
 */
class PostgresYearEndPoll implements YearEndPoll
{
    private PDO $db;

    /** @var array<string, mixed>|null|false false until loaded */
    private $poll = false;

    /** @var array<string, array<string, mixed>>|null */
    private ?array $categories = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    private function poll(): ?array
    {
        if ($this->poll === false) {
            $stmt = $this->db->prepare("
                SELECT id, name, voting_opens_at, voting_closes_at, intro_html, closed_html
                FROM year_end_polls
                WHERE status IN ('open', 'closed')
                ORDER BY (status = 'open') DESC, year DESC
                LIMIT 1
            ");
            $stmt->execute();
            $row = $stmt->fetch();
            $this->poll = $row ?: null;
        }
        return $this->poll;
    }

    /** @return array<string, array<string, mixed>> keyed by category slug, in creation order */
    private function categories(): array
    {
        if ($this->categories === null) {
            $this->categories = [];
            $poll = $this->poll();
            if ($poll) {
                $stmt = $this->db->prepare("
                    SELECT id, slug, display_name, max_picks, required_for_contest
                    FROM year_end_poll_categories
                    WHERE poll_id = :poll
                    ORDER BY id
                ");
                $stmt->execute([':poll' => $poll['id']]);
                foreach ($stmt->fetchAll() as $row) {
                    $this->categories[$row['slug']] = $row;
                }
            }
        }
        return $this->categories;
    }

    private function category(string $slug): array
    {
        $categories = $this->categories();
        if (!isset($categories[$slug])) {
            throw new \InvalidArgumentException("Unknown Year End Poll category: {$slug}");
        }
        return $categories[$slug];
    }

    public function getPollInfo(): ?array
    {
        $poll = $this->poll();
        if (!$poll) {
            return null;
        }
        return [
            'name' => $poll['name'],
            'opensAt' => $poll['voting_opens_at'],
            'closesAt' => $poll['voting_closes_at'],
            'introHtml' => $poll['intro_html'] ?? '',
            'closedHtml' => $poll['closed_html'] ?? '',
        ];
    }

    public function getPollNames(): array
    {
        return array_keys($this->categories());
    }

    public function getPollValues(string $pollName): array
    {
        $category = $this->category($pollName);
        $stmt = $this->db->prepare("
            SELECT n.id,
                   COALESCE(NULLIF(n.custom_label, ''), s.display_name, r.display_name, a.name, c.title_plain, '') AS label,
                   COALESCE(n.vote_count, 0) AS votes
            FROM year_end_poll_categories_nominees n
            LEFT JOIN songs s ON s.id = n.song_id
            LEFT JOIN records r ON r.id = n.record_id
            LEFT JOIN artists a ON a.id = n.artist_id
            LEFT JOIN concerts c ON c.id = n.concert_id
            WHERE n._parent_id = :category
        ");
        $stmt->execute([':category' => $category['id']]);
        $rows = $stmt->fetchAll();

        usort($rows, function ($a, $b) {
            return strcasecmp(self::sortKey($a['label']), self::sortKey($b['label']));
        });
        return $rows;
    }

    private static function sortKey(string $label): string
    {
        return preg_replace('/^the\s+/i', '', trim($label));
    }

    public function getColumnNames(string $pollName): array
    {
        return ['id', 'label', 'votes'];
    }

    public function getMaxPicks(string $pollName): int
    {
        return (int)$this->category($pollName)['max_picks'];
    }

    public function formatPollName(string $pollName): string
    {
        return $this->category($pollName)['display_name'];
    }

    public function formatPollHeader(string $pollName, string $category): string
    {
        return 'Vote for Your Top <span id="max_pick">' . $this->getMaxPicks($pollName) . '</span> '
            . htmlspecialchars($this->formatPollName($pollName));
    }

    public function hasVoted(string $ip, string $pollName): bool
    {
        $stmt = $this->db->prepare("
            SELECT 1 FROM year_end_poll_votes WHERE category_id = :category AND user_id = :voter
            UNION ALL
            SELECT 1 FROM year_end_poll_write_ins WHERE category_id = :category2 AND user_id = :voter2
            LIMIT 1
        ");
        $categoryId = $this->category($pollName)['id'];
        $stmt->execute([
            ':category' => $categoryId,
            ':voter' => $ip,
            ':category2' => $categoryId,
            ':voter2' => $ip,
        ]);
        return (bool)$stmt->fetch();
    }

    private function isVotingOpen(): bool
    {
        $poll = $this->poll();
        if (!$poll) {
            return false;
        }
        $now = time();
        $opens = $poll['voting_opens_at'] ? strtotime($poll['voting_opens_at']) : null;
        $closes = $poll['voting_closes_at'] ? strtotime($poll['voting_closes_at']) : null;
        return ($opens === null || $now >= $opens) && ($closes === null || $now <= $closes);
    }

    public function recordBallot(string $voter, string $pollName, array $votes, string $writeInValue = ''): bool
    {
        if ($voter === '') {
            throw new \InvalidArgumentException('A logged-in voter is required');
        }
        if (!$this->isVotingOpen()) {
            throw new \RuntimeException('Year End Poll voting is closed');
        }

        $category = $this->category($pollName);
        $votes = array_values(array_unique(array_map('strval', $votes)));
        $writeInValue = trim($writeInValue);
        $picks = count($votes) + ($writeInValue !== '' ? 1 : 0);
        if ($picks === 0 || $picks > (int)$category['max_picks']) {
            throw new \InvalidArgumentException("Expected 1-{$category['max_picks']} picks, got {$picks}");
        }

        $validIds = array_column($this->getPollValues($pollName), 'id');
        foreach ($votes as $nomineeId) {
            if (!in_array($nomineeId, $validIds, true)) {
                throw new \InvalidArgumentException("Nominee {$nomineeId} is not in {$pollName}");
            }
        }

        $this->db->beginTransaction();
        try {
            if ($this->hasVoted($voter, $pollName)) {
                throw new \RuntimeException('Voter already voted in this category');
            }

            $insertVote = $this->db->prepare("
                INSERT INTO year_end_poll_votes (poll_id, category_id, nominee_id, user_id, updated_at, created_at)
                VALUES (:poll, :category, :nominee, :voter, NOW(), NOW())
            ");
            $bumpCount = $this->db->prepare("
                UPDATE year_end_poll_categories_nominees
                SET vote_count = COALESCE(vote_count, 0) + 1
                WHERE _parent_id = :category AND id = :nominee
            ");
            foreach ($votes as $nomineeId) {
                $insertVote->execute([
                    ':poll' => $this->poll()['id'],
                    ':category' => $category['id'],
                    ':nominee' => $nomineeId,
                    ':voter' => $voter,
                ]);
                $bumpCount->execute([':category' => $category['id'], ':nominee' => $nomineeId]);
            }

            if ($writeInValue !== '') {
                $this->db->prepare("
                    INSERT INTO year_end_poll_write_ins (poll_id, category_id, write_in, user_id, updated_at, created_at)
                    VALUES (:poll, :category, :write_in, :voter, NOW(), NOW())
                ")->execute([
                    ':poll' => $this->poll()['id'],
                    ':category' => $category['id'],
                    ':write_in' => $writeInValue,
                    ':voter' => $voter,
                ]);
            }

            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function canEnterContest(string $ip): bool
    {
        foreach ($this->categories() as $slug => $category) {
            if ($category['required_for_contest'] && !$this->hasVoted($ip, $slug)) {
                return false;
            }
        }
        return true;
    }

    private function contestantExists(string $column, string $value): bool
    {
        $poll = $this->poll();
        if (!$poll) {
            return false;
        }
        $stmt = $this->db->prepare(
            "SELECT 1 FROM year_end_poll_contestants WHERE poll_id = :poll AND {$column} = :value LIMIT 1"
        );
        $stmt->execute([':poll' => $poll['id'], ':value' => $value]);
        return (bool)$stmt->fetch();
    }

    public function hasEnteredContest(string $ip): bool
    {
        return $this->contestantExists('user_id', $ip);
    }

    public function hasEnteredContestByEmail(string $email): bool
    {
        return $this->contestantExists('LOWER(email)', strtolower(trim($email)));
    }

    public function hasEnteredContestByPhone(string $phone): bool
    {
        return $this->contestantExists('phone', trim($phone));
    }

    public function addContestant(array $contestantData, string $ip): bool
    {
        $poll = $this->poll();
        if (!$poll) {
            throw new \RuntimeException('No Year End Poll to enter');
        }
        $stmt = $this->db->prepare("
            INSERT INTO year_end_poll_contestants
                (poll_id, name, hometown, email, phone, entered_contest, newsletter_opt_in, user_id, updated_at, created_at)
            VALUES (:poll, :name, :hometown, :email, :phone, :entered, :newsletter, :voter, NOW(), NOW())
        ");
        $stmt->bindValue(':poll', $poll['id'], PDO::PARAM_INT);
        $stmt->bindValue(':name', trim($contestantData['name'] ?? ''));
        $stmt->bindValue(':hometown', trim($contestantData['hometown'] ?? ''));
        $stmt->bindValue(':email', strtolower(trim($contestantData['email'] ?? '')));
        $stmt->bindValue(':phone', trim($contestantData['phone'] ?? ''));
        $stmt->bindValue(':entered', ($contestantData['contest'] ?? '') === 'yes', PDO::PARAM_BOOL);
        $stmt->bindValue(':newsletter', ($contestantData['newsletter'] ?? '') === 'yes', PDO::PARAM_BOOL);
        $stmt->bindValue(':voter', $ip);
        return $stmt->execute();
    }

    private function cpRetired(string $method): void
    {
        throw new \LogicException(
            "PostgresYearEndPoll::{$method} backs the legacy CP; use the Payload admin instead"
        );
    }

    public function getAllContestEntries(): array
    {
        $this->cpRetired(__FUNCTION__);
        return [];
    }

    public function getContestantById(int $contestantId): ?array
    {
        $this->cpRetired(__FUNCTION__);
        return null;
    }

    public function getContestantSongVotes(string $ipAddress): ?array
    {
        $this->cpRetired(__FUNCTION__);
        return null;
    }

    public function getPollResults(string $pollName): array
    {
        $this->cpRetired(__FUNCTION__);
        return [];
    }

    public function getWriteInsForPoll(string $pollName): array
    {
        $this->cpRetired(__FUNCTION__);
        return [];
    }
}
