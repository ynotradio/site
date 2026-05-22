<?php

namespace YNotRadio\Models\Implementations;

use PDO;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use YNotRadio\Models\Schedule;

/**
 * PostgreSQL implementation of the Schedule model.
 * Reads schedule data from Payload's "shows" collection tables.
 */
class PostgresSchedule implements Schedule {
    use ConvertsLexicalToHtml;

    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT
                s.id,
                (s.date AT TIME ZONE 'America/New_York')::date::text AS date,
                trim(to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMDay')) AS day,
                to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMMonth DD, YYYY') AS fdate,
                s.start_time,
                s.end_time,
                to_char(s.start_time::time, 'FMHH12:MIAM') AS stime,
                to_char(s.start_time::time, 'FMHH12AM') AS stime_no_min,
                to_char(s.start_time::time, 'MI') AS start_min,
                to_char(s.end_time::time, 'FMHH12:MIAM') AS etime,
                to_char(s.end_time::time, 'FMHH12AM') AS etime_no_min,
                to_char(s.end_time::time, 'MI') AS end_min,
                COALESCE(s.name, '') AS show_name,
                COALESCE(d.display_name, '') AS host_display,
                s.note::text AS note
            FROM shows s
            LEFT JOIN djs d ON d.id = s.host_id
            WHERE s.id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return $this->formatEntry($row);
    }

    public function getByDate(string $date): array {
        $stmt = $this->db->prepare("
            SELECT
                s.id,
                (s.date AT TIME ZONE 'America/New_York')::date::text AS date,
                trim(to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMDay')) AS day,
                to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMMonth DD, YYYY') AS fdate,
                s.start_time,
                s.end_time,
                to_char(s.start_time::time, 'FMHH12:MIAM') AS stime,
                to_char(s.start_time::time, 'FMHH12AM') AS stime_no_min,
                to_char(s.start_time::time, 'MI') AS start_min,
                to_char(s.end_time::time, 'FMHH12:MIAM') AS etime,
                to_char(s.end_time::time, 'FMHH12AM') AS etime_no_min,
                to_char(s.end_time::time, 'MI') AS end_min,
                COALESCE(s.name, '') AS show_name,
                COALESCE(d.display_name, '') AS host_display,
                s.note::text AS note
            FROM shows s
            LEFT JOIN djs d ON d.id = s.host_id
            WHERE (s.date AT TIME ZONE 'America/New_York')::date = :schedule_date::date
            ORDER BY s.start_time, s.id
        ");
        $stmt->execute(['schedule_date' => $date]);

        $rows = $stmt->fetchAll();

        return array_map(fn($row) => $this->formatEntry($row), $rows);
    }

    public function getUpcoming(int $limit = 7): array {
        $stmt = $this->db->prepare("
            SELECT
                s.id,
                (s.date AT TIME ZONE 'America/New_York')::date::text AS date,
                trim(to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMDay')) AS day,
                to_char((s.date AT TIME ZONE 'America/New_York')::date, 'MM/DD/YY') AS fdate,
                s.start_time,
                s.end_time,
                to_char(s.start_time::time, 'FMHH12:MIAM') AS stime,
                to_char(s.start_time::time, 'FMHH12AM') AS stime_no_min,
                to_char(s.start_time::time, 'MI') AS start_min,
                to_char(s.end_time::time, 'FMHH12:MIAM') AS etime,
                to_char(s.end_time::time, 'FMHH12AM') AS etime_no_min,
                to_char(s.end_time::time, 'MI') AS end_min,
                COALESCE(s.name, '') AS show_name,
                COALESCE(d.display_name, '') AS host_display,
                s.note::text AS note
            FROM shows s
            LEFT JOIN djs d ON d.id = s.host_id
            WHERE (s.date AT TIME ZONE 'America/New_York')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
            ORDER BY (s.date AT TIME ZONE 'America/New_York')::date, s.start_time, s.id
        ");
        $stmt->execute();

        return $this->groupEntriesByDate($stmt->fetchAll(), $limit);
    }

    public function getAllForAdmin(): array {
        $stmt = $this->db->prepare("
            SELECT
                s.id,
                (s.date AT TIME ZONE 'America/New_York')::date::text AS date,
                trim(to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMDay')) AS day,
                to_char((s.date AT TIME ZONE 'America/New_York')::date, 'MM/DD/YY') AS fdate,
                s.start_time,
                s.end_time,
                to_char(s.start_time::time, 'FMHH12:MIAM') AS stime,
                to_char(s.start_time::time, 'FMHH12AM') AS stime_no_min,
                to_char(s.start_time::time, 'MI') AS start_min,
                to_char(s.end_time::time, 'FMHH12:MIAM') AS etime,
                to_char(s.end_time::time, 'FMHH12AM') AS etime_no_min,
                to_char(s.end_time::time, 'MI') AS end_min,
                COALESCE(s.name, '') AS show_name,
                COALESCE(d.display_name, '') AS host_display,
                s.note::text AS note
            FROM shows s
            LEFT JOIN djs d ON d.id = s.host_id
            WHERE (s.date AT TIME ZONE 'America/New_York')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
            ORDER BY (s.date AT TIME ZONE 'America/New_York')::date, s.start_time, s.id
        ");
        $stmt->execute();

        return $this->groupEntriesByDate($stmt->fetchAll());
    }

    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL schedule model. ' .
            'Please use Payload CMS admin interface or API for creating schedule entries.'
        );
    }

    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL schedule model. ' .
            'Please use Payload CMS admin interface or API for updating schedule entries.'
        );
    }

    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL schedule model. ' .
            'Please use Payload CMS admin interface or API for deleting schedule entries.'
        );
    }

    public function copyDay(string $sourceDate, string $targetDate): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL schedule model. ' .
            'Please use Payload CMS admin interface or API for copying schedule entries.'
        );
    }

    private function formatEntry(array $row): array {
        $row['host'] = $this->formatLegacyHost($row['show_name'] ?? '', $row['host_display'] ?? '');
        unset($row['show_name'], $row['host_display']);

        if (isset($row['note'])) {
            $row['note'] = $this->formatLegacyNoteHtml($this->convertLexicalToHtml($row['note']));
        }

        return $row;
    }

    private function formatLegacyHost(string $showName, string $hostDisplay): string {
        $showName = trim($showName);
        $hostDisplay = trim($hostDisplay);

        if ($hostDisplay === '' && preg_match('/<[^>]+>/', $showName)) {
            return $showName;
        }

        if ($showName !== '' && $hostDisplay !== '') {
            return '<i>' . $showName . '</i> w/ ' . $hostDisplay;
        }

        if ($hostDisplay !== '') {
            return $hostDisplay;
        }

        if ($showName === '') {
            return '';
        }

        if (stripos($showName, ' w/ ') !== false) {
            [$showTitle, $showHost] = explode(' w/ ', $showName, 2);
            $showTitle = trim($showTitle);
            $showHost = trim($showHost);
            if ($showTitle !== '' && $showHost !== '') {
                return '<i>' . $showTitle . '</i> w/ ' . $showHost;
            }
        }

        return $showName;
    }

    private function formatLegacyNoteHtml(string $note): string {
        $normalized = trim(html_entity_decode($note, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if ($normalized === '') {
            return '';
        }

        $normalized = preg_replace('/^\s*<p>(.*)<\/p>\s*$/s', '$1', $normalized);
        $normalized = str_replace(['</p><p>', '</p>' . PHP_EOL . '<p>'], '<br>', (string) $normalized);
        $normalized = str_replace(['<p>', '</p>'], '', (string) $normalized);

        return trim((string) $normalized);
    }

    private function groupEntriesByDate(array $rows, ?int $limitDays = null): array {
        $grouped = [];
        $countedDays = 0;

        foreach ($rows as $row) {
            $date = $row['date'];

            if (!isset($grouped[$date])) {
                if ($limitDays !== null && $countedDays >= $limitDays) {
                    break;
                }

                $grouped[$date] = [
                    'date_info' => [
                        'date' => $row['date'],
                        'day' => $row['day'],
                        'fdate' => $row['fdate'],
                    ],
                    'entries' => [],
                ];
                $countedDays += 1;
            }

            $grouped[$date]['entries'][] = $this->formatEntry($row);
        }

        return array_values($grouped);
    }
}
