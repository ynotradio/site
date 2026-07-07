<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Top11;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use PDO;

/**
 * PostgreSQL implementation of the Top11 interface.
 * Reads and writes the top11_contests / top11_votes / top11_write_ins /
 * top11_contestants tables managed by Payload's Top11 collections.
 *
 * Only the methods top11.php and _top11_save.php actually call are fully
 * implemented (getMessage, getAll, getStatus, getAllSongs,
 * hasUserVotedThisWeek, recordUserVote, addContestant, addVote, addWriteIn).
 * The remaining interface methods back the legacy CP admin screens
 * (top11_operations.php, top11_song_*.php, etc.), which Payload's Contest
 * Controls tab (see PR #799) has superseded -- they throw instead of
 * reimplementing CP semantics against Payload's immutable, versioned contest
 * model, which doesn't map cleanly onto free-editable MySQL rows.
 */
class PostgresTop11 implements Top11
{
    use ConvertsLexicalToHtml;

    private PDO $db;

    /** Payload ID of the currently open (or most recently created) contest. */
    private ?int $contestId = null;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Resolve the contest to serve: the open contest if one exists, otherwise
     * the most recently created contest (so a just-closed week is still
     * readable instead of the page going blank between weeks).
     */
    private function getActiveContestId(): ?int
    {
        if ($this->contestId !== null) {
            return $this->contestId;
        }

        $stmt = $this->db->prepare("
            SELECT id FROM top11_contests
            ORDER BY (status = 'open') DESC, week_of DESC
            LIMIT 1
        ");
        $stmt->execute();
        $row = $stmt->fetch();

        $this->contestId = $row ? (int)$row['id'] : null;
        return $this->contestId;
    }

    /** {@inheritdoc} */
    public function getMessage(): array
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            return ['id' => 1, 'message' => ''];
        }

        $stmt = $this->db->prepare("
            SELECT message_snapshot_headline, message_snapshot_body
            FROM top11_contests WHERE id = :id
        ");
        $stmt->execute([':id' => $contestId]);
        $row = $stmt->fetch();

        if (!$row) {
            return ['id' => 1, 'message' => ''];
        }

        $html = $this->convertLexicalToHtml($row['message_snapshot_body']);
        return ['id' => 1, 'message' => $html];
    }

    /** {@inheritdoc} */
    public function getAll(): array
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            return [];
        }

        $stmt = $this->db->prepare("
            SELECT c.week_of, e.\"_order\" AS display_order, e.song_id, e.weekly_note,
                   s.title AS song_title, a.name AS artist_name
            FROM top11_contests_entries e
            JOIN top11_contests c ON c.id = e._parent_id
            LEFT JOIN songs s ON s.id = e.song_id
            LEFT JOIN artists a ON a.id = s.artist_id
            WHERE e._parent_id = :id
            ORDER BY e.\"_order\"
        ");
        $stmt->execute([':id' => $contestId]);

        $entries = [];
        while ($row = $stmt->fetch()) {
            $entries[] = [
                'placement' => (int)$row['display_order'],
                'artist' => $row['artist_name'] ?? '',
                'song' => $row['song_title'] ?? '',
                'note' => $row['weekly_note'] ? $this->convertLexicalToHtml($row['weekly_note']) : '',
            ];
        }

        // top11.php reads placement 99 as the week-of title row and 98 as
        // the status row, matching the legacy top11 table's sentinel rows.
        $stmt = $this->db->prepare("SELECT week_of, status FROM top11_contests WHERE id = :id");
        $stmt->execute([':id' => $contestId]);
        $contest = $stmt->fetch();

        $entries[] = ['placement' => 99, 'artist' => $this->formatWeekOf($contest['week_of']), 'song' => '', 'note' => ''];
        $entries[] = ['placement' => 98, 'artist' => $contest['status'] === 'open' ? 'open' : 'closed', 'song' => '', 'note' => ''];

        return $entries;
    }

    private function formatWeekOf(string $weekOf): string
    {
        // Matches legacy MySQL's placement-99 date row verbatim (e.g. "July 2,
        // 2026", no weekday) -- SqlTop11::getAll() returns that string as-is.
        $date = new \DateTime($weekOf);
        return $date->format('F j, Y');
    }

    /** {@inheritdoc} */
    public function getStatus(): string
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            return 'closed';
        }

        $stmt = $this->db->prepare("SELECT status FROM top11_contests WHERE id = :id");
        $stmt->execute([':id' => $contestId]);
        $row = $stmt->fetch();

        return ($row && $row['status'] === 'open') ? 'open' : 'closed';
    }

    /** {@inheritdoc} */
    public function getAllSongs(): array
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            return [];
        }

        // Distinct from getAll()'s entries: this is the nominee ballot voters
        // choose from, not last week's ranked results.
        $stmt = $this->db->prepare("
            SELECT n.song_id AS id, s.title AS song, a.name AS artist
            FROM top11_contests_nominees n
            LEFT JOIN songs s ON s.id = n.song_id
            LEFT JOIN artists a ON a.id = s.artist_id
            WHERE n._parent_id = :id
            ORDER BY a.name, s.title
        ");
        $stmt->execute([':id' => $contestId]);

        $songs = [];
        while ($row = $stmt->fetch()) {
            $songs[] = [
                'id' => (int)$row['id'],
                'song' => $row['song'] ?? '',
                'artist' => $row['artist'] ?? '',
            ];
        }

        return $songs;
    }

    /** {@inheritdoc} */
    public function addVote(int $id): bool
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            throw new \Exception('No active Top 11 contest to vote in');
        }

        // The nominee-pool check mirrors Top11Votes' beforeChange hook; the
        // real guarantee is the top11_votes_song_is_nominee DB trigger (see
        // migration 20260706_210000_add_top11_votes_nominee_constraint),
        // which will also reject this insert if the check below is ever
        // wrong or bypassed.
        $stmt = $this->db->prepare("
            SELECT 1 FROM top11_contests_nominees WHERE _parent_id = :cid AND song_id = :sid
        ");
        $stmt->execute([':cid' => $contestId, ':sid' => $id]);
        if (!$stmt->fetch()) {
            throw new \Exception('This song is not on the ballot for this contest');
        }

        // ON CONFLICT DO NOTHING against the (contest_id, voter_key, song_id)
        // unique index (see migration
        // 20260706_220000_relax_top11_votes_voterkey_uniqueness): a voter
        // resubmitting the same song is a no-op, not an error, matching
        // legacy MySQL's idempotent counter-increment semantics.
        $stmt = $this->db->prepare("
            INSERT INTO top11_votes (contest_id, song_id, voter_email, voter_auth0_id, vote_source, updated_at, created_at)
            VALUES (:contest_id, :song_id, :voter_email, :voter_auth0_id, 'web', NOW(), NOW())
            ON CONFLICT DO NOTHING
        ");
        return $stmt->execute([
            ':contest_id' => $contestId,
            ':song_id' => $id,
            ':voter_email' => $this->pendingVoterEmail ?: null,
            ':voter_auth0_id' => $this->pendingVoterAuth0Id ?: null,
        ]);
    }

    /**
     * top11.php calls addVote() once per checked song without passing voter
     * identity (it's carried separately via recordUserVote's parameters), so
     * _top11_save.php must set these before calling addVote() in a loop.
     * Kept as adapter-only state, not part of the Top11 interface, since
     * MySQL's addVote($id) genuinely takes no voter argument either.
     */
    public string $pendingVoterEmail = '';
    public string $pendingVoterAuth0Id = '';

    /** {@inheritdoc} */
    public function addContestant(string $firstname, string $lastname, string $email, string $phone, string $contest, string $newsletter): bool
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            throw new \Exception('No active Top 11 contest to enter');
        }

        $stmt = $this->db->prepare("
            INSERT INTO top11_contestants
                (contest_id, first_name, last_name, email, phone, entered_contest, newsletter_opt_in, display, updated_at, created_at)
            VALUES
                (:contest_id, :first_name, :last_name, :email, :phone, :entered_contest, :newsletter_opt_in, true, NOW(), NOW())
        ");
        return $stmt->execute([
            ':contest_id' => $contestId,
            ':first_name' => $firstname,
            ':last_name' => $lastname,
            ':email' => $email,
            ':phone' => $phone,
            // PDO's native (non-emulated) pgsql prepares don't reliably bind
            // native PHP bools -- Postgres accepts the 'true'/'false' string
            // literals directly for boolean columns.
            ':entered_contest' => $contest === 'yes' ? 'true' : 'false',
            ':newsletter_opt_in' => $newsletter === 'yes' ? 'true' : 'false',
        ]);
    }

    /** {@inheritdoc} */
    public function addWriteIn(string $writeIn): bool
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            throw new \Exception('No active Top 11 contest to write in for');
        }

        $stmt = $this->db->prepare("
            INSERT INTO top11_write_ins (contest_id, write_in, voter_email, display, updated_at, created_at)
            VALUES (:contest_id, :write_in, :voter_email, true, NOW(), NOW())
        ");
        return $stmt->execute([
            ':contest_id' => $contestId,
            ':write_in' => $writeIn,
            ':voter_email' => $this->pendingVoterEmail ?: null,
        ]);
    }

    /** {@inheritdoc} */
    public function hasUserVotedThisWeek(string $userEmail, ?string $auth0Id = null): bool
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId || empty($userEmail)) {
            return false;
        }

        $stmt = $this->db->prepare("
            SELECT 1 FROM top11_votes
            WHERE contest_id = :contest_id
              AND (voter_email = :email OR (:auth0_id != '' AND voter_auth0_id = :auth0_id))
            LIMIT 1
        ");
        $stmt->execute([
            ':contest_id' => $contestId,
            ':email' => $userEmail,
            ':auth0_id' => $auth0Id ?? '',
        ]);

        return (bool)$stmt->fetch();
    }

    /** {@inheritdoc} */
    public function recordUserVote(string $userEmail, ?string $auth0Id = null): bool
    {
        // Legacy MySQL tracks "has this user voted" as a separate table from
        // the per-song vote rows; Postgres's schema uses top11_votes' own
        // voter_email/voter_auth0_id columns for the same purpose, so this
        // is a no-op check rather than a second insert. addVote() is what
        // actually records the vote; this just needs to hand the voter
        // identity to it before the caller's addVote() loop runs.
        $this->pendingVoterEmail = $userEmail;
        $this->pendingVoterAuth0Id = $auth0Id ?? '';
        return true;
    }

    /** {@inheritdoc} */
    public function getCurrentVotingWeek(): string
    {
        $contestId = $this->getActiveContestId();
        if (!$contestId) {
            return 'current';
        }

        $stmt = $this->db->prepare("SELECT week_of FROM top11_contests WHERE id = :id");
        $stmt->execute([':id' => $contestId]);
        $row = $stmt->fetch();

        return $row ? $row['week_of'] : 'current';
    }

    // ─────────────────────────────────────────────────────────────────────
    // CP-only methods: Payload's Contest Controls tab (PR #799) supersedes
    // the legacy CP screens that call these. They throw instead of silently
    // no-op-ing so a flag flip surfaces the retirement clearly rather than
    // failing quietly.
    // ─────────────────────────────────────────────────────────────────────

    private function cpRetired(string $method): never
    {
        throw new \Exception(
            "Top11::{$method}() is not available on the Postgres adapter -- "
                . 'use the Payload admin Contest Controls tab instead of the legacy CP screens.'
        );
    }

    /** {@inheritdoc} */
    public function getById(int $id): ?array
    {
        $this->cpRetired('getById');
    }

    /** {@inheritdoc} */
    public function toggleStatus(string $currentStatus): bool
    {
        $this->cpRetired('toggleStatus');
    }

    /** {@inheritdoc} */
    public function update(int $placement, string $artist, string $song, string $note): bool
    {
        $this->cpRetired('update');
    }

    /** {@inheritdoc} */
    public function updateDate(string $date): bool
    {
        $this->cpRetired('updateDate');
    }

    /** {@inheritdoc} */
    public function updateMessage(string $message): bool
    {
        $this->cpRetired('updateMessage');
    }

    /** {@inheritdoc} */
    public function addSong(string $artist, string $song): int
    {
        $this->cpRetired('addSong');
    }

    /** {@inheritdoc} */
    public function updateSong(int $id, string $artist, string $song): bool
    {
        $this->cpRetired('updateSong');
    }

    /** {@inheritdoc} */
    public function deleteSong(int $id): bool
    {
        $this->cpRetired('deleteSong');
    }

    /** {@inheritdoc} */
    public function getSong(int $id): ?array
    {
        $this->cpRetired('getSong');
    }

    /** {@inheritdoc} */
    public function getAllContestants(): array
    {
        $this->cpRetired('getAllContestants');
    }

    /** {@inheritdoc} */
    public function getContestantCount(): string
    {
        $this->cpRetired('getContestantCount');
    }

    /** {@inheritdoc} */
    public function pickWinner(): array
    {
        $this->cpRetired('pickWinner');
    }

    /** {@inheritdoc} */
    public function getNewsletterSignups(): array
    {
        $this->cpRetired('getNewsletterSignups');
    }

    /** {@inheritdoc} */
    public function getAllWriteIns(): array
    {
        $this->cpRetired('getAllWriteIns');
    }

    /** {@inheritdoc} */
    public function reset(): bool
    {
        $this->cpRetired('reset');
    }
}
