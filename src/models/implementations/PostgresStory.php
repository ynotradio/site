<?php

namespace YNotRadio\Models\Implementations;

use PDO;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use YNotRadio\Models\Story;

class PostgresStory implements Story {
    use ConvertsLexicalToHtml;

    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT
                p.id,
                to_char((p.start_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS start_date,
                to_char((p.end_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS end_date,
                COALESCE(p.headline, '') AS headline,
                COALESCE(p.content::text, '') AS story,
                COALESCE(p.image_url, '') AS pic,
                COALESCE(p.link_url, '') AS pic_url,
                COALESCE(p.priority, 0) AS priority,
                CASE WHEN p._status = 'published' THEN 'n' ELSE 'y' END AS deleted
            FROM posts p
            WHERE p.id = :id
            LIMIT 1
        ");

        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return $this->formatStoryRow($row);
    }

    public function getAll($amount = 'all'): array {
        $limitSql = '';
        if ($amount !== 'all') {
            $limitSql = ' LIMIT ' . intval($amount);
        }

        $stmt = $this->db->prepare("
            SELECT
                p.id,
                to_char((p.start_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS start_date,
                to_char((p.end_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS end_date,
                COALESCE(p.headline, '') AS headline,
                COALESCE(p.content::text, '') AS story,
                COALESCE(p.image_url, '') AS pic,
                COALESCE(p.link_url, '') AS pic_url,
                COALESCE(p.priority, 0) AS priority,
                'n' AS deleted
            FROM posts p
            WHERE p._status = 'published'
              AND COALESCE(p.show_on_front_page, true) = true
              AND (p.start_date AT TIME ZONE 'America/New_York')::date <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
              AND (p.end_date AT TIME ZONE 'America/New_York')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
            ORDER BY p.priority ASC
            {$limitSql}
        ");

        $stmt->execute();
        $rows = $stmt->fetchAll();
        $rows = array_map(fn($row) => $this->formatStoryRow($row), $rows);

        $oddResults = [];
        $evenResults = [];

        for ($i = 1; $i <= count($rows); $i += 1) {
            if (fmod($i, 2) == 0) {
                $evenResults[] = $rows[$i - 1];
            } else {
                $oddResults[] = $rows[$i - 1];
            }
        }

        return [$oddResults, $evenResults];
    }

    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL story model. ' .
            'Use the legacy MySQL admin path or Payload CMS admin/API for writes.'
        );
    }

    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL story model. ' .
            'Use the legacy MySQL admin path or Payload CMS admin/API for writes.'
        );
    }

    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL story model. ' .
            'Use the legacy MySQL admin path or Payload CMS admin/API for writes.'
        );
    }

    public function updatePriorities(array $priorities): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL story model. ' .
            'Use the legacy MySQL admin path or Payload CMS admin/API for writes.'
        );
    }

    public function getAllActive(): array {
        $stmt = $this->db->prepare("
            SELECT
                p.id,
                to_char((p.start_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS start_date,
                to_char((p.end_date AT TIME ZONE 'America/New_York')::date, 'YYYY-MM-DD') AS end_date,
                COALESCE(p.headline, '') AS headline,
                COALESCE(p.content::text, '') AS story,
                COALESCE(p.image_url, '') AS pic,
                COALESCE(p.link_url, '') AS pic_url,
                COALESCE(p.priority, 0) AS priority,
                CASE WHEN p._status = 'published' THEN 'n' ELSE 'y' END AS deleted
            FROM posts p
            WHERE p._status = 'published'
            ORDER BY p.priority ASC
        ");

        $stmt->execute();
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => $this->formatStoryRow($row), $rows);
    }

    private function formatStoryRow(array $row): array {
        if (isset($row['story'])) {
            $row['story'] = $this->convertLexicalToHtml($row['story']);
        }

        $row['priority'] = (string) intval($row['priority']);

        return $row;
    }
}

