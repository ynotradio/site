<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\YearEndStaffPick;
use YNotRadio\Models\Concerns\RendersLexicalEmbeds;
use PDO;

/**
 * Staff picks from Payload's year_end_staff_picks collection. getAll()
 * returns the most recent year's picks as structured rows (name, details,
 * songs, albums, players) for yearendstaffpicks.php to render. Editing
 * happens in the Payload admin, so the CP write methods are unsupported.
 */
class PostgresYearEndStaffPick implements YearEndStaffPick
{
    use RendersLexicalEmbeds;

    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getYear(): ?int
    {
        $stmt = $this->db->prepare('SELECT MAX(year) AS year FROM year_end_staff_picks');
        $stmt->execute();
        $row = $stmt->fetch();
        return $row && $row['year'] !== null ? (int)$row['year'] : null;
    }

    public function getAll(): array
    {
        $year = $this->getYear();
        if ($year === null) {
            return [];
        }

        $stmt = $this->db->prepare("
            SELECT id, name, show_name, details, mixcloud_urls
            FROM year_end_staff_picks
            WHERE year = :year
            ORDER BY sort_order, name
        ");
        $stmt->execute([':year' => $year]);
        $picks = [];
        foreach ($stmt->fetchAll() as $row) {
            $picks[(int)$row['id']] = [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'showName' => $row['show_name'] ?? '',
                'details' => $this->lines($row['details'] ?? ''),
                'players' => $this->players($row['mixcloud_urls'] ?? ''),
                'songs' => [],
                'albums' => [],
            ];
        }
        if (!$picks) {
            return [];
        }

        foreach (['songs', 'albums'] as $list) {
            $items = $this->db->prepare("
                SELECT _parent_id, artist, title
                FROM year_end_staff_picks_{$list}
                WHERE _parent_id IN (SELECT id FROM year_end_staff_picks WHERE year = :year)
                ORDER BY _parent_id, _order
            ");
            $items->execute([':year' => $year]);
            foreach ($items->fetchAll() as $item) {
                $picks[(int)$item['_parent_id']][$list][] = [
                    'artist' => $item['artist'] ?? '',
                    'title' => $item['title'] ?? '',
                ];
            }
        }

        return array_values($picks);
    }

    private function lines(string $text): array
    {
        return array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $text))));
    }

    /** @return string[] Mixcloud mini-player iframe URLs */
    private function players(string $urls): array
    {
        $players = [];
        foreach ($this->lines($urls) as $url) {
            $feed = $this->extractMixcloudFeed($url);
            if ($feed !== null && strpos($url, 'mixcloud.com') !== false) {
                $players[] = 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed='
                    . rawurlencode($feed);
            }
        }
        return $players;
    }

    public function getById(int $id): ?array
    {
        throw new \LogicException('Staff picks are edited in Payload');
    }

    public function getCount(): int
    {
        throw new \LogicException('Staff picks are edited in Payload');
    }

    public function add(array $data): int
    {
        throw new \LogicException('Staff picks are edited in Payload');
    }

    public function update(int $id, array $data): bool
    {
        throw new \LogicException('Staff picks are edited in Payload');
    }

    public function delete(int $id): bool
    {
        throw new \LogicException('Staff picks are edited in Payload');
    }
}
