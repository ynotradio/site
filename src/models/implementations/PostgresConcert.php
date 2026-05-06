<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Concert;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Concert model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresConcert implements Concert {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare(
            $this->concertSelectSql() . "
            WHERE c.id = :id
            " . $this->concertGroupBySql()
        );

        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        $result['date'] = $this->formatDate($result['date']);
        $result['featured'] = 'No';

        return $result;
    }

    public function getAll(int $limit = 64): array {
        $stmt = $this->db->prepare(
            $this->concertSelectSql() .
            $this->concertGroupBySql() . "
            ORDER BY c.date DESC, c.legacy_id DESC, c.id DESC
            LIMIT :limit"
        );

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $this->formatResults($stmt->fetchAll());
    }

    public function getUpcoming(int $limit = 500): array {
        $stmt = $this->db->prepare(
            $this->concertSelectSql() . "
            WHERE c.date::date >= CURRENT_DATE
              AND c._status = 'published'
            " . $this->concertGroupBySql() . "
            ORDER BY c.date ASC, c.legacy_id ASC, c.id ASC
            LIMIT :limit"
        );

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $this->formatResults($stmt->fetchAll());
    }

    public function getFeatured(int $limit = 5): array {
        // Featured concerts have been removed from the Payload schema.
        return [];
    }

    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported. Use Payload CMS admin interface or API.'
        );
    }

    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported. Use Payload CMS admin interface or API.'
        );
    }

    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported. Use Payload CMS admin interface or API.'
        );
    }

    public function getConcertInfo(int $id): string {
        $concert = $this->getById($id);

        if (!$concert) {
            throw new \RuntimeException("Concert not found with ID: $id");
        }

        return $concert['artist'] . " at " . $concert['venue'];
    }

    private function concertSelectSql(): string {
        return "
            SELECT
                c.id,
                c.date,
                c.venue_id,
                c.ticket_info as ticketinfo,
                c.ticket_url as ticketurl,
                v.name as venue,
                COALESCE(NULLIF(c.title_html, ''), string_agg(a.name, ', ' ORDER BY cr.order)) as artist,
                COALESCE(a_first.website, '') as band_url,
                COALESCE(a_first_photo.url, '') as band_pic_url,
                'n' as deleted
            FROM concerts c
            LEFT JOIN venues v ON c.venue_id = v.id
            LEFT JOIN concerts_rels cr ON c.id = cr.parent_id AND cr.path = 'artists'
            LEFT JOIN artists a ON cr.artists_id = a.id
            LEFT JOIN LATERAL (
                SELECT ar.id, ar.website, ar.photo_id
                FROM concerts_rels crr
                JOIN artists ar ON crr.artists_id = ar.id
                WHERE crr.parent_id = c.id AND crr.path = 'artists'
                ORDER BY crr.order
                LIMIT 1
            ) a_first ON true
            LEFT JOIN media a_first_photo ON a_first.photo_id = a_first_photo.id
        ";
    }

    private function concertGroupBySql(): string {
        return "
            GROUP BY c.id, c.date, c.venue_id, c.ticket_info, c.ticket_url, c.title_html,
                     v.name, a_first.website, a_first_photo.url
        ";
    }

    private function formatDate(string $timestamp): string {
        return (new \DateTime($timestamp))->format('Y-m-d');
    }

    private function formatResults(array $results): array {
        return array_map(fn($row) => array_merge($row, [
            'date' => $this->formatDate($row['date']),
            'featured' => 'No',
        ]), $results);
    }
}
