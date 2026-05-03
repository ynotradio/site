<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Schedule;
use YNotRadio\Models\Concerns\ConvertsLexicalToHtml;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the Schedule model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresSchedule implements Schedule {
    use ConvertsLexicalToHtml;

    private PDO $db;

    // Lexical text format bit flags
    private const FORMAT_BOLD = 1;
    private const FORMAT_ITALIC = 2;
    private const FORMAT_UNDERLINE = 8;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Build the SQL expression that produces the schedule "host" string for
     * display. When a show has both a name (e.g., "Britspotting") and a host
     * person (e.g., "Matt McGrath"), legacy production renders these joined
     * with " w/ " — "Britspotting w/ Matt McGrath". Either side may be empty.
     *
     * Uses CONCAT_WS so NULL values are skipped automatically:
     *   - both present  → "Show Name w/ Host"
     *   - host only     → "Host"
     *   - name only     → "Show Name"
     *   - neither       → ""
     */
    private function buildHostExpression(): string {
        return "COALESCE(NULLIF(CONCAT_WS(' w/ ', "
             . "NULLIF(s.name, ''), "
             . "(SELECT string_agg(p.name, ', ' ORDER BY dr.order) "
             . " FROM djs_rels dr "
             . " JOIN people p ON dr.people_id = p.id "
             . " WHERE dr.parent_id = s.host_id AND dr.path = 'person')"
             . "), ''), '') as host";
    }

    /**
     * Get a specific schedule entry by ID
     * 
     * @param int $id The ID of the schedule entry to retrieve
     * @return array|null The schedule data or null if not found
     */
    public function getById(int $id): ?array {
        $hostExpr = $this->buildHostExpression();
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.date,
                s.start_time as start_time,
                s.end_time as end_time,
                {$hostExpr},
                COALESCE(s.note::text, '') as note,
                'n' as deleted
            FROM shows s
            LEFT JOIN djs d ON s.host_id = d.id
            WHERE s.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }

    /**
     * Get all schedule entries for a specific date
     * 
     * @param string $date The date to get schedule for (format: YYYY-MM-DD)
     * @return array Array of schedule entries
     */
    public function getByDate(string $date): array {
        $hostExpr = $this->buildHostExpression();
        $stmt = $this->db->prepare("
            SELECT 
                s.id,
                s.date,
                s.start_time as start_time,
                s.end_time as end_time,
                {$hostExpr},
                COALESCE(s.note::text, '') as note,
                'n' as deleted
            FROM shows s
            LEFT JOIN djs d ON s.host_id = d.id
            WHERE s.date = :date
            ORDER BY s.start_time
        ");
        
        $stmt->execute(['date' => $date]);
        $results = $stmt->fetchAll();
        
        return array_map([$this, 'formatResult'], $results);
    }

    /**
     * Get all upcoming schedule entries (limited to next 7 days by default)
     * 
     * @param int $limit The number of days to include (default: 7)
     * @return array Array of schedule entries grouped by date
     */
    public function getUpcoming(int $limit = 7): array {
        return $this->getScheduleGroupedByDate($limit);
    }

    /**
     * Get all upcoming schedule entries for admin view
     * 
     * @return array Array of schedule entries grouped by date
     */
    public function getAllForAdmin(): array {
        return $this->getScheduleGroupedByDate(null);
    }

    /**
     * Get schedule entries grouped by date
     * 
     * @param int|null $limit The number of days to include (null for all days)
     * @return array Array of schedule entries grouped by date
     */
    private function getScheduleGroupedByDate(?int $limit): array {
        $hostExpr = $this->buildHostExpression();
        // Build query to get all entries with date info in one go
        $query = "
            SELECT 
                s.id,
                s.date,
                TO_CHAR(s.date, 'MM/DD/YY') as fdate,
                s.start_time as start_time,
                s.end_time as end_time,
                {$hostExpr},
                COALESCE(s.note::text, '') as note,
                'n' as deleted
            FROM shows s
            LEFT JOIN djs d ON s.host_id = d.id
            WHERE s.date::date >= CURRENT_DATE
            ORDER BY s.date, s.start_time
        ";
        
        // Add limit if specified (for getUpcoming)
        if ($limit !== null) {
            // Use a subquery to limit by distinct dates
            $query = "
                WITH limited_dates AS (
                    SELECT DISTINCT date::date as date
                    FROM shows
                    WHERE date::date >= CURRENT_DATE
                    ORDER BY date
                    LIMIT :limit
                )
                SELECT 
                    s.id,
                    s.date,
                    TO_CHAR(s.date, 'MM/DD/YY') as fdate,
                    s.start_time as start_time,
                    s.end_time as end_time,
                    {$hostExpr},
                    COALESCE(s.note::text, '') as note,
                    'n' as deleted
                FROM shows s
                LEFT JOIN djs d ON s.host_id = d.id
                WHERE s.date::date IN (SELECT date FROM limited_dates)
                ORDER BY s.date, s.start_time
            ";
        }

        $stmt = $this->db->prepare($query);
        if ($limit !== null) {
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        }
        $stmt->execute();
        $allEntries = $stmt->fetchAll();

        // Format all entries and group by date
        $allEntries = array_map([$this, 'formatResult'], $allEntries);

        // Group entries by date
        $schedule = [];
        $currentDate = null;
        $dateEntries = [];
        $dateInfo = null;

        foreach ($allEntries as $entry) {
            if ($currentDate !== $entry['date']) {
                // Save previous date's entries if any
                if ($currentDate !== null) {
                    $schedule[] = [
                        'date_info' => $dateInfo,
                        'entries' => $dateEntries
                    ];
                }
                
                // Start new date group
                $currentDate = $entry['date'];
                $dateEntries = [];
                $dateInfo = [
                    'date' => $entry['date'],
                    'day' => $entry['day'],
                    'fdate' => $entry['fdate']
                ];
            }
            
            $dateEntries[] = $entry;
        }

        // Add the last date's entries
        if ($currentDate !== null) {
            $schedule[] = [
                'date_info' => $dateInfo,
                'entries' => $dateEntries
            ];
        }

        return $schedule;
    }

    /**
     * Add a new schedule entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The schedule data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating shows.'
        );
    }

    /**
     * Update an existing schedule entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the schedule entry to update
     * @param array $data The updated schedule data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating shows.'
        );
    }

    /**
     * Delete a schedule entry (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the schedule entry to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting shows.'
        );
    }

    /**
     * Copy an entire day's schedule to another date
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param string $sourceDate The source date (format: YYYY-MM-DD)
     * @param string $targetDate The target date (format: YYYY-MM-DD)
     * @return bool Whether the copy was successful
     * @throws \RuntimeException Always throws exception
     */
    public function copyDay(string $sourceDate, string $targetDate): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for copying schedule days.'
        );
    }

    /**
     * Format a single result to match MySQL output format
     * Converts PostgreSQL time formats to match MySQL's TIME_FORMAT output
     * 
     * @param array $row Raw database result
     * @return array Formatted result
     */
    private function formatResult(array $row): array {
        // Format date to MySQL format (YYYY-MM-DD)
        if (isset($row['date'])) {
            $row['date'] = $this->formatDate($row['date']);
            
            // Calculate day from date if not present
            if (!isset($row['day'])) {
                $date = new \DateTime($row['date']);
                $dayName = strtolower($date->format('l')); // 'monday', 'tuesday', etc.
                $row['day'] = ucfirst($dayName); // 'Monday', 'Tuesday', etc.
            }
        }

        // Format day name to match MySQL format (e.g., "Monday") if it exists
        if (isset($row['day'])) {
            $row['day'] = $this->formatDayName($row['day']);
        }

        // Add formatted date (fdate) if not present
        if (isset($row['date']) && !isset($row['fdate'])) {
            $date = new \DateTime($row['date']);
            $row['fdate'] = $date->format('m/d/y');
        }

        // Format start_time to match MySQL TIME_FORMAT output
        if (isset($row['start_time'])) {
            $row = array_merge($row, $this->formatTime($row['start_time'], 's'));
        }

        // Format end_time to match MySQL TIME_FORMAT output
        if (isset($row['end_time'])) {
            $row = array_merge($row, $this->formatTime($row['end_time'], 'e'));
        }

        // Convert Lexical JSON note to HTML for display
        if (isset($row['note']) && !empty($row['note'])) {
            $row['note'] = $this->convertLexicalToHtml($row['note']);
        }

        return $row;
    }

    /**
     * Format PostgreSQL timestamp/date to MySQL date format (YYYY-MM-DD)
     * 
     * @param string $timestamp PostgreSQL timestamp or date
     * @return string MySQL date format
     */
    private function formatDate(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('Y-m-d');
    }

    /**
     * Format PostgreSQL day name to match MySQL format
     * Converts lowercase day names to capitalized full names
     * 
     * @param string $day PostgreSQL day name (e.g., 'monday')
     * @return string MySQL format day name (e.g., 'Monday')
     */
    private function formatDayName(string $day): string {
        return ucfirst(strtolower($day));
    }

    /**
     * Format time to match MySQL TIME_FORMAT output
     * Generates stime/etime, stime_no_min/etime_no_min, and start_min/end_min fields
     * 
     * @param string $time Time string (HH:MM:SS or HH:MM format)
     * @param string $prefix 's' for start time, 'e' for end time
     * @return array Formatted time fields
     */
    private function formatTime(string $time, string $prefix): array {
        // Parse time string
        $timeParts = explode(':', $time);
        $hour = intval($timeParts[0]);
        $minute = isset($timeParts[1]) ? intval($timeParts[1]) : 0;

        // Format hour for 12-hour time
        $hour12 = $hour % 12;
        if ($hour12 === 0) {
            $hour12 = 12;
        }
        $ampm = $hour < 12 ? 'AM' : 'PM';

        // Format minute with leading zero
        $minuteStr = str_pad($minute, 2, '0', STR_PAD_LEFT);

        // Build result array with appropriate field names
        $result = [];
        $result[$prefix . 'time'] = sprintf('%d:%s%s', $hour12, $minuteStr, $ampm);
        $result[$prefix . 'time_no_min'] = sprintf('%d%s', $hour12, $ampm);
        
        // Generate minute field name: start_min or end_min
        if ($prefix === 's') {
            $result['start_min'] = $minuteStr;
        } else {
            $result['end_min'] = $minuteStr;
        }

        return $result;
    }

    /**
     * Convert Lexical JSON format to HTML
     * Payload CMS stores content in Lexical JSON format, but the frontend expects HTML
     * 
     * @param string $lexicalJson Lexical JSON string
     * @return string HTML content
     */
    private function convertLexicalToHtml(string $lexicalJson): string {
        // Try to decode as JSON first
        $lexical = json_decode($lexicalJson, true);
        
        // If it's not valid JSON, assume it's already HTML
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $lexicalJson;
        }
        
        try {
            if (!isset($lexical['root']['children'])) {
                return $lexicalJson;
            }
            
            $html = '';
            foreach ($lexical['root']['children'] as $node) {
                $html .= $this->convertLexicalNodeToHtml($node);
            }
            
            return $html;
        } catch (\Exception $e) {
            error_log("PostgresSchedule: Failed to convert Lexical to HTML: " . $e->getMessage());
            return $lexicalJson;
        }
    }

    /**
     * Convert a single Lexical node to HTML
     * 
     * @param array $node Lexical node
     * @return string HTML representation
     */
    private function convertLexicalNodeToHtml(array $node): string {
        $type = $node['type'] ?? '';
        
        switch ($type) {
            case 'paragraph':
                $content = $this->convertLexicalChildren($node);
                $format = $node['format'] ?? '';
                return $this->wrapInBlock('p', $content, $format);
                
            case 'heading':
                $tag = $node['tag'] ?? 'h2';
                $content = $this->convertLexicalChildren($node);
                return "<$tag>$content</$tag>\n";
                
            case 'list':
                $listType = $node['listType'] ?? 'bullet';
                $tag = $listType === 'number' ? 'ol' : 'ul';
                $content = $this->convertLexicalChildren($node);
                return "<$tag>$content</$tag>\n";
                
            case 'listitem':
                $content = $this->convertLexicalChildren($node);
                return "<li>$content</li>\n";
                
            case 'link':
                $rawUrl = $node['url'] ?? '';
                $url = $this->isValidUrl($rawUrl) ? $rawUrl : '#';
                $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
                $content = $this->convertLexicalChildren($node);
                return "<a href=\"$url\">$content</a>";
                
            case 'text':
                $text = $node['text'] ?? '';
                $format = $node['format'] ?? 0;
                
                if ($format & self::FORMAT_BOLD) {
                    $text = "<strong>$text</strong>";
                }
                if ($format & self::FORMAT_ITALIC) {
                    $text = "<em>$text</em>";
                }
                if ($format & self::FORMAT_UNDERLINE) {
                    $text = "<u>$text</u>";
                }
                
                return $text;
                
            default:
                return $this->convertLexicalChildren($node);
        }
    }

    /**
     * Convert children of a Lexical node to HTML
     * 
     * @param array $node Lexical node with children
     * @return string HTML representation of children
     */
    private function convertLexicalChildren(array $node): string {
        if (!isset($node['children']) || !is_array($node['children'])) {
            return '';
        }
        
        $html = '';
        foreach ($node['children'] as $child) {
            $html .= $this->convertLexicalNodeToHtml($child);
        }
        
        return $html;
    }

    /**
     * Validate URL to prevent XSS attacks
     * Only allows http, https, and relative URLs
     * 
     * @param string $url URL to validate
     * @return bool True if URL is valid and safe
     */
    private function isValidUrl(string $url): bool {
        if (substr($url, 0, 1) === '/') {
            return true;
        }
        
        if (substr($url, 0, 1) === '#') {
            return true;
        }
        
        $parsed = parse_url($url);
        
        if ($parsed === false) {
            return false;
        }
        
        if (isset($parsed['scheme'])) {
            $scheme = strtolower($parsed['scheme']);
            return $scheme === 'http' || $scheme === 'https';
        }
        
        return true;
    }
}
