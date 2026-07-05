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
        $stmt = $this->db->prepare($this->buildSelect('FMMonth DD, YYYY') . "
            WHERE s.id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->formatEntry($row) : null;
    }

    public function getByDate(string $date): array {
        $stmt = $this->db->prepare($this->buildSelect('FMMonth DD, YYYY') . "
            WHERE (s.date AT TIME ZONE 'America/New_York')::date = :schedule_date::date
            ORDER BY s.start_time, s.id
        ");
        $stmt->execute(['schedule_date' => $date]);

        return array_map(fn($row) => $this->formatEntry($row), $stmt->fetchAll());
    }

    public function getUpcoming(int $limit = 7): array {
        return $this->groupEntriesByDate($this->fetchUpcomingRows(), $limit);
    }

    public function getAllForAdmin(): array {
        return $this->groupEntriesByDate($this->fetchUpcomingRows());
    }

    public function add(array $data): int {
        throw $this->writeNotSupportedException('creating');
    }

    public function update(int $id, array $data): bool {
        throw $this->writeNotSupportedException('updating');
    }

    public function delete(int $id): bool {
        throw $this->writeNotSupportedException('deleting');
    }

    public function copyDay(string $sourceDate, string $targetDate): bool {
        throw $this->writeNotSupportedException('copying');
    }

    private function buildSelect(string $fdateFormat): string {
        return "
            SELECT
                s.id,
                (s.date AT TIME ZONE 'America/New_York')::date::text AS date,
                trim(to_char((s.date AT TIME ZONE 'America/New_York')::date, 'FMDay')) AS day,
                to_char((s.date AT TIME ZONE 'America/New_York')::date, '{$fdateFormat}') AS fdate,
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
        ";
    }

    private function fetchUpcomingRows(): array {
        $stmt = $this->db->prepare($this->buildSelect('MM/DD/YY') . "
            WHERE (s.date AT TIME ZONE 'America/New_York')::date >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York')::date
            ORDER BY (s.date AT TIME ZONE 'America/New_York')::date, s.start_time, s.id
        ");
        $stmt->execute();

        return $stmt->fetchAll();
    }

    private function writeNotSupportedException(string $operation): \RuntimeException {
        return new \RuntimeException(
            'Write operations are not supported in the PostgreSQL schedule model. ' .
            "Please use Payload CMS admin interface or API for {$operation} schedule entries."
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
                $countedDays++;
            }

            $grouped[$date]['entries'][] = $this->formatEntry($row);
        }

        return array_values($grouped);
    }
}
