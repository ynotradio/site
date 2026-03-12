<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\ModernRockMadness;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the ModernRockMadness interface
 * Reads tournament/bracket/match data from Payload CMS Postgres tables.
 * Writes votes directly to the modern_rock_madness_votes table.
 *
 * Match IDs are exposed as match_number (1–63) to preserve compatibility
 * with the bracket display partials that rely on id=63 for the championship.
 * Band IDs are exposed as placement (1–64) so getBandByPlacement() works
 * without any callers needing to change.
 */
class PostgresModernRockMadness implements ModernRockMadness
{
    private PDO $db;

    /** Payload ID of the active (or most-recently-completed) tournament. */
    private ?int $tournamentId = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tournament resolution
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Return the Payload tournament ID to use for all queries.
     * Prefers the active tournament; falls back to the most recently started
     * completed tournament so the finished bracket is still readable.
     */
    private function getActiveTournamentId(): ?int
    {
        if ($this->tournamentId !== null) {
            return $this->tournamentId;
        }

        $stmt = $this->db->query("
            SELECT id FROM modern_rock_madness_tournaments
            WHERE status = 'active'
            LIMIT 1
        ");
        $row = $stmt->fetch();

        if (!$row) {
            // Fall back to most recently started completed tournament
            $stmt = $this->db->query("
                SELECT id FROM modern_rock_madness_tournaments
                WHERE status = 'complete'
                ORDER BY start_date DESC
                LIMIT 1
            ");
            $row = $stmt->fetch();
        }

        $this->tournamentId = $row ? (int)$row['id'] : null;
        return $this->tournamentId;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shared SQL helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * SELECT clause that normalises Payload match rows into the shape the PHP
     * partials expect (match_number as id, placement-based band IDs, etc.).
     */
    private function matchSelectClause(): string
    {
        return "
            m.match_number                                   AS id,
            m.region,
            COALESCE(g1.placement, 0)                        AS band1_id,
            COALESCE(m.band1_votes, 0)                       AS band1_votes,
            COALESCE(g2.placement, 0)                        AS band2_id,
            COALESCE(m.band2_votes, 0)                       AS band2_votes,
            TO_CHAR(m.start_time::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS start_time,
            TO_CHAR(m.end_time::timestamptz   AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS end_time,
            COALESCE(gw.placement, 0)                        AS winner_id,
            m.show_score,
            COALESCE(m.sponsor, '')                          AS sponsor,
            COALESCE(m.sponsor_message, '')                  AS sponsor_msg,
            m.id                                             AS payload_id
        ";
    }

    /** Common FROM + JOIN clause used by most match queries. */
    private function matchFromClause(): string
    {
        return "
            FROM modern_rock_madness_matches m
            LEFT JOIN modern_rock_madness_groups g1 ON m.band1_id  = g1.id
            LEFT JOIN modern_rock_madness_groups g2 ON m.band2_id  = g2.id
            LEFT JOIN modern_rock_madness_groups gw ON m.winner_id = gw.id
        ";
    }

    /**
     * Format a raw match row for return to callers.
     * Casts numeric-string columns to the types callers expect.
     */
    private function formatMatch(array $row): array
    {
        $row['id']          = (int)$row['id'];
        $row['band1_id']    = (int)$row['band1_id'];
        $row['band2_id']    = (int)$row['band2_id'];
        $row['band1_votes'] = (int)$row['band1_votes'];
        $row['band2_votes'] = (int)$row['band2_votes'];
        $row['winner_id']   = (int)$row['winner_id'];
        $row['show_score']  = (bool)$row['show_score'];
        return $row;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Interface implementation
    // ─────────────────────────────────────────────────────────────────────────

    /** {@inheritdoc} */
    public function getCurrentMatch(): ?array
    {
        $tId = $this->getActiveTournamentId();
        if (!$tId) {
            return ['id' => 8888, '_debug' => 'no_tournament_id'];
        }

        // DEBUG: capture time comparison for e2e diagnosis
        $debug = $this->db->query("SELECT NOW()::text AS pg_now, current_setting('TIMEZONE') AS tz")->fetch();
        $m1 = $this->db->prepare("SELECT start_time, end_time, pg_typeof(start_time)::text AS col_type FROM modern_rock_madness_matches WHERE tournament_id = :tid AND match_number = 1");
        $m1->execute([':tid' => $tId]);
        $m1r = $m1->fetch();

        $stmt = $this->db->prepare("
            SELECT {$this->matchSelectClause()}
            {$this->matchFromClause()}
            WHERE m.tournament_id = :tid
              AND NOW() >= m.start_time::timestamptz
              AND NOW() <  m.end_time::timestamptz
            LIMIT 1
        ");
        $stmt->execute([':tid' => $tId]);
        $row = $stmt->fetch();

        $result = $row ? $this->formatMatch($row) : ['id' => 8888];
        // Attach debug info to the result
        $result['_debug'] = [
            'pg_now' => $debug['pg_now'] ?? 'N/A',
            'pg_tz' => $debug['tz'] ?? 'N/A',
            'tid' => $tId,
            'match1_start' => $m1r['start_time'] ?? 'N/A',
            'match1_end' => $m1r['end_time'] ?? 'N/A',
            'col_type' => $m1r['col_type'] ?? 'N/A',
        ];
        return $result;
    }

    /** @internal Debug info from last getCurrentMatch call */
    public array $_debugInfo = [];

    /** {@inheritdoc} */
    public function getMatch(int $matchId): ?array
    {
        $tId = $this->getActiveTournamentId();
        if (!$tId) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT {$this->matchSelectClause()}
            {$this->matchFromClause()}
            WHERE m.tournament_id = :tid
              AND m.match_number  = :mn
            LIMIT 1
        ");
        $stmt->execute([':tid' => $tId, ':mn' => $matchId]);
        $row = $stmt->fetch();

        return $row ? $this->formatMatch($row) : null;
    }

    /** {@inheritdoc} */
    public function getNextMatch(): ?array
    {
        $tId = $this->getActiveTournamentId();
        if (!$tId) {
            return null;
        }

        $stmt = $this->db->prepare("
            SELECT
                m.match_number                                   AS id,
                COALESCE(g1.placement, 0)                        AS band1_id,
                COALESCE(g2.placement, 0)                        AS band2_id,
                TO_CHAR(m.start_time::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS start_time,
                TO_CHAR(m.start_time::timestamptz AT TIME ZONE 'UTC', 'HH12:MI')               AS fdate
            {$this->matchFromClause()}
            WHERE m.tournament_id = :tid
              AND NOW() < m.start_time::timestamptz
            ORDER BY m.start_time::timestamptz ASC
            LIMIT 1
        ");
        $stmt->execute([':tid' => $tId]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        $row['id']       = (int)$row['id'];
        $row['band1_id'] = (int)$row['band1_id'];
        $row['band2_id'] = (int)$row['band2_id'];
        return $row;
    }

    /** {@inheritdoc} */
    public function getBandByPlacement(int $placement): ?array
    {
        if ($placement === 0) {
            return [
                'id'        => 0,
                'name'      => 'TBD',
                'url'       => '',
                'pic_url'   => '',
                'placement' => 0,
                'seed'      => '',
                'abbr'      => 'TBD',
                'sponsor'   => '',
            ];
        }

        $tId = $this->getActiveTournamentId();

        // Prefer the group's own name/url; fall back to primary artist fields.
        // Image: prefer the group's override media, then the first linked artist's photo.
        $stmt = $this->db->prepare("
            SELECT
                g.placement                                       AS id,
                COALESCE(g.name, a_first.name, '')                AS name,
                COALESCE(g.url,  a_first.website, '')             AS url,
                COALESCE(
                    gimg.legacy_url,
                    gimg.url,
                    aimg.legacy_url,
                    aimg.url,
                    ''
                )                                                 AS pic_url,
                g.placement,
                g.seed,
                COALESCE(g.abbreviation, '')                      AS abbr,
                COALESCE(g.sponsor, '')                           AS sponsor
            FROM modern_rock_madness_groups g
            -- Primary artist for name / website fallback
            LEFT JOIN LATERAL (
                SELECT a.name, a.website, a.photo_id
                FROM modern_rock_madness_groups_rels gr
                JOIN artists a ON gr.artists_id = a.id
                WHERE gr.parent_id = g.id AND gr.path = 'artists'
                ORDER BY gr.order ASC
                LIMIT 1
            ) a_first ON true
            -- Group's own image override
            LEFT JOIN media gimg ON g.image_id = gimg.id
            -- Primary artist photo fallback
            LEFT JOIN media aimg ON a_first.photo_id = aimg.id
            WHERE g.placement = :placement
              AND g.tournament_id = :tid
            LIMIT 1
        ");
        $stmt->execute([':placement' => $placement, ':tid' => $tId ?? 0]);
        $row = $stmt->fetch();

        if (!$row) {
            // Placeholder for unknown band
            return [
                'id'        => $placement,
                'name'      => 'Band #' . $placement,
                'url'       => '',
                'pic_url'   => '',
                'placement' => $placement,
                'seed'      => $placement,
                'abbr'      => 'B' . $placement,
                'sponsor'   => '',
            ];
        }

        $row['id']        = (int)$row['id'];
        $row['placement'] = (int)$row['placement'];
        $row['seed']      = (int)$row['seed'];
        return $row;
    }

    /** {@inheritdoc} */
    public function getMatchStatus(int $matchId): string
    {
        $match = $this->getMatch($matchId);

        if (!$match) {
            return 'early';
        }

        // Times from matchSelectClause() are always UTC, so compare with gmdate
        $now = gmdate('Y-m-d H:i:s');

        if ($now > $match['end_time']) {
            return 'over';
        } elseif ($now > $match['start_time']) {
            return 'running';
        } else {
            return 'early';
        }
    }

    /** {@inheritdoc} */
    public function isTournamentOver(): bool
    {
        $match = $this->getMatch(63); // Championship is always match_number 63
        return $match !== null && $match['winner_id'] !== 0;
    }

    /** {@inheritdoc} */
    public function isWaitingForFinal(): bool
    {
        $match = $this->getMatch(63);
        if (!$match) {
            return false;
        }
        $now = gmdate('Y-m-d H:i:s');
        return $match['end_time'] < $now && $match['winner_id'] === 0;
    }

    /** {@inheritdoc} */
    public function getChampion(): ?array
    {
        $match = $this->getMatch(63);
        if (!$match || $match['winner_id'] === 0) {
            return null;
        }
        return $this->getBandByPlacement($match['winner_id']);
    }

    /** {@inheritdoc} */
    public function getTournamentYear(?string $startDate = null): string
    {
        if ($startDate !== null) {
            return date('Y', strtotime($startDate));
        }

        // If no date provided, try to read from the tournament record
        $tId = $this->getActiveTournamentId();
        if ($tId) {
            $stmt = $this->db->prepare(
                "SELECT year FROM modern_rock_madness_tournaments WHERE id = :id LIMIT 1"
            );
            $stmt->execute([':id' => $tId]);
            $row = $stmt->fetch();
            if ($row) {
                return (string)$row['year'];
            }
        }

        return date('Y');
    }

    /** {@inheritdoc} */
    public function hasVoted(int $matchId, string $voterEmail): bool
    {
        if (empty($voterEmail)) {
            return false;
        }

        $tId = $this->getActiveTournamentId();
        if (!$tId) {
            return false;
        }

        // Resolve the Payload match row ID from match_number
        $stmt = $this->db->prepare("
            SELECT id FROM modern_rock_madness_matches
            WHERE tournament_id = :tid AND match_number = :mn
            LIMIT 1
        ");
        $stmt->execute([':tid' => $tId, ':mn' => $matchId]);
        $matchRow = $stmt->fetch();

        if (!$matchRow) {
            return false;
        }

        $stmt = $this->db->prepare("
            SELECT 1 FROM modern_rock_madness_votes
            WHERE match_id = :mid AND user_id = :uid
            LIMIT 1
        ");
        $stmt->execute([':mid' => $matchRow['id'], ':uid' => $voterEmail]);
        return (bool)$stmt->fetch();
    }

    /** {@inheritdoc} */
    public function recordVote(int $matchId, int $bandNumber, string $voterEmail, string $voterIp): bool
    {
        if ($this->hasVoted($matchId, $voterEmail)) {
            return false;
        }

        $match = $this->getMatch($matchId);
        if (!$match) {
            throw new \Exception('Match not found');
        }

        $now = date('Y-m-d H:i:s');
        if ($now >= $match['end_time']) {
            return false; // Match has ended
        }

        if ($bandNumber !== 1 && $bandNumber !== 2) {
            throw new \Exception('Invalid band number');
        }

        $tId = $this->getActiveTournamentId();

        // Resolve Payload match row ID and voted group ID
        $bandPlacement = $match['band' . $bandNumber . '_id'];

        $stmt = $this->db->prepare("
            SELECT m.id AS match_payload_id, g.id AS group_payload_id
            FROM modern_rock_madness_matches m
            JOIN modern_rock_madness_groups g
              ON g.placement = :placement AND g.tournament_id = m.tournament_id
            WHERE m.tournament_id = :tid AND m.match_number = :mn
            LIMIT 1
        ");
        $stmt->execute([
            ':placement' => $bandPlacement,
            ':tid'       => $tId,
            ':mn'        => $matchId,
        ]);
        $ids = $stmt->fetch();

        if (!$ids) {
            throw new \Exception('Could not resolve match or group IDs');
        }

        // Use email as the Auth0-style userId; fall back to IP if email is empty
        $userId = !empty($voterEmail) ? $voterEmail : $voterIp;

        $this->db->beginTransaction();
        try {
            // Insert the individual vote record
            $insertStmt = $this->db->prepare("
                INSERT INTO modern_rock_madness_votes
                    (match_id, group_id, user_id, updated_at, created_at)
                VALUES
                    (:match_id, :group_id, :user_id, NOW(), NOW())
            ");
            $insertStmt->execute([
                ':match_id' => $ids['match_payload_id'],
                ':group_id' => $ids['group_payload_id'],
                ':user_id'  => $userId,
            ]);

            // Increment the cached vote counter on the match row.
            // Use a whitelist for the column name to prevent any injection risk.
            $voteColMap = [1 => 'band1_votes', 2 => 'band2_votes'];
            $voteCol    = $voteColMap[$bandNumber];
            $updateStmt = $this->db->prepare("
                UPDATE modern_rock_madness_matches
                SET {$voteCol} = COALESCE({$voteCol}, 0) + 1,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $updateStmt->execute([':id' => $ids['match_payload_id']]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw new \Exception('Error recording vote: ' . $e->getMessage());
        }
    }

    /** {@inheritdoc} */
    public function calculateVotePercentage(int $votes1, int $votes2, string $display = 'none'): string
    {
        if ($votes1 === 0 && $votes2 === 0) {
            return $display === 'none' ? '' : '50%';
        }
        return round(($votes1 / ($votes1 + $votes2)) * 100, 0) . '%';
    }

    /** {@inheritdoc} */
    public function getBracketMatches(): array
    {
        $tId = $this->getActiveTournamentId();
        if (!$tId) {
            return [];
        }

        $stmt = $this->db->prepare("
            SELECT {$this->matchSelectClause()}
            {$this->matchFromClause()}
            WHERE m.tournament_id = :tid
            ORDER BY m.region ASC, m.match_number ASC
        ");
        $stmt->execute([':tid' => $tId]);
        $rows = $stmt->fetchAll();

        $matches = [];
        foreach ($rows as $row) {
            $region            = (int)$row['region'];
            $matches[$region][] = $this->formatMatch($row);
        }

        return $matches;
    }

    /** {@inheritdoc} */
    public function getTimelineData(string $startDate): array
    {
        $dates = $this->getTournamentDates($startDate);

        return [
            'first_round_left'   => explode('-', $dates['first_round_left'])[0],
            'second_round_left'  => $dates['second_round_left'],
            'sweet_16'           => $dates['sweet_16'],
            'elusive_8'          => $dates['elusive_8'],
            'final_4'            => $dates['final_4'],
            'championship'       => $dates['championship'],
            'second_round_right' => $dates['second_round_right'],
            'first_round_right'  => explode('-', $dates['first_round_right'])[0],
        ];
    }

    /** {@inheritdoc} */
    public function getTournamentDates(string $startDate): array
    {
        $start = strtotime($startDate);

        // Snap to Monday
        if (date('N', $start) !== '1') {
            $start = strtotime('next Monday', $start);
        }

        $dates = [];

        $frls = $start;
        $frle = strtotime('+1 day', $frls);
        $dates['first_round_left'] = date('F j', $frls) . '-' . date('j', $frle);

        $frrs = strtotime('+2 days', $frls);
        $frre = strtotime('+1 day', $frrs);
        $dates['first_round_right'] = date('F j', $frrs) . '-' . date('j', $frre);

        $srl = strtotime('+7 days', $frls);
        $dates['second_round_left']  = date('F j', $srl);
        $dates['second_round_right'] = date('F j', strtotime('+1 day', $srl));
        $dates['sweet_16']    = date('F j', strtotime('+2 days', $srl));
        $dates['elusive_8']   = date('F j', strtotime('+3 days', $srl));
        $dates['final_4']     = date('F j', strtotime('+3 days', $srl));
        $dates['championship'] = date('F j', strtotime('+4 days', $srl));

        return $dates;
    }

    /** {@inheritdoc} */
    public function getWinnerClass(int $bandId, int $matchId): string
    {
        $match = $this->getMatch($matchId);

        if (!$match || $match['winner_id'] === 0) {
            return '';
        }

        return $match['winner_id'] === $bandId ? ' mrm_winner' : ' mrm_loser';
    }

    /** {@inheritdoc} */
    public function isMatchTied(array $match): bool
    {
        return $match['band1_votes'] === $match['band2_votes'];
    }

    /** {@inheritdoc} */
    public function getSponsorInfo(?int $matchId = null): ?array
    {
        if ($matchId === null) {
            $match = $this->getCurrentMatch();
            if (!$match || $match['id'] === 8888) {
                return null;
            }
            $matchId = $match['id'];
        }

        $match = $this->getMatch($matchId);

        if (!$match || empty($match['sponsor'])) {
            return null;
        }

        return [
            'name'    => $match['sponsor'],
            'message' => $match['sponsor_msg'] ?? '',
        ];
    }
}
