<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\OnDemand;
use PDO;
use PDOException;

/**
 * PostgreSQL implementation of the OnDemand model
 * Reads from Neon PostgreSQL database created by Payload CMS
 */
class PostgresOnDemand implements OnDemand {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Get a specific on demand entry by ID
     * 
     * @param int $id The ID of the on demand entry to retrieve
     * @return array|null The on demand data or null if not found
     */
    public function getById(int $id): ?array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations for on-demand images
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                o.id,
                o.date,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.legacy_url, '')
                END as image,
                o.headline,
                o.note,
                o.audio_url,
                COALESCE(o.source, 'opendrive') as source,
                (
                    SELECT string_agg(s.title, ', ' ORDER BY or_songs.order)
                    FROM ondemand_rels or_songs
                    JOIN songs s ON or_songs.songs_id = s.id
                    WHERE or_songs.parent_id = o.id AND or_songs.path = 'songs'
                ) as songs,
                (
                    SELECT string_agg(p.name, ', ' ORDER BY or_djs.order)
                    FROM ondemand_rels or_djs
                    JOIN djs d ON or_djs.djs_id = d.id
                    JOIN djs_rels dr ON d.id = dr.parent_id AND dr.path = 'person'
                    JOIN people p ON dr.people_id = p.id
                    WHERE or_djs.parent_id = o.id AND or_djs.path = 'djs'
                ) as dj_names,
                (
                    SELECT string_agg(a.name, ', ' ORDER BY or_artists.order)
                    FROM ondemand_rels or_artists
                    JOIN artists a ON or_artists.artists_id = a.id
                    WHERE or_artists.parent_id = o.id AND or_artists.path = 'artists'
                ) as artist_names
            FROM ondemand o
            LEFT JOIN media m ON o.image_id = m.id
            WHERE o.id = :id
        ");
        
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return null;
        }
        
        return $this->formatResult($result);
    }
    }

    /**
     * Get all on demand entries, filtered by page and sort order
     * 
     * @param string $sort The sort order ('date', 'artist', or 'text')
     * @param int $page The page number
     * @param int $limit Items per page
     * @return array Array of on demand entries
     */
    public function getAll(string $sort = 'date', int $page = 1, int $limit = 5): array {
        if ($sort === 'text') {
            return $this->getAllTextList();
        }
        
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations for on-demand images
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";
        
        // Calculate the starting position for pagination
        $offset = ($page - 1) * $limit;
        
        // Determine order by clause
        $orderBy = ($sort === 'date') ? 'o.date DESC' : 'o.headline ASC';
        
        $stmt = $this->db->prepare("
            SELECT 
                o.id,
                o.date,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.legacy_url, '')
                END as image,
                o.headline,
                o.note,
                o.audio_url,
                (
                    SELECT string_agg(s.title, ', ' ORDER BY or_songs.order)
                    FROM ondemand_rels or_songs
                    JOIN songs s ON or_songs.songs_id = s.id
                    WHERE or_songs.parent_id = o.id AND or_songs.path = 'songs'
                ) as songs
            FROM ondemand o
            LEFT JOIN media m ON o.image_id = m.id
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset
        ");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Get all on demand entries as a text list (headline and date only)
     * 
     * @return array Array of on demand entries with id, headline, and fdate
     */
    private function getAllTextList(): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                headline,
                date
            FROM ondemand
            ORDER BY headline ASC, date DESC
        ");
        
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        return array_map(function($row) {
            return [
                'id' => $row['id'],
                'headline' => $row['headline'],
                'fdate' => $this->formatDateShort($row['date'])
            ];
        }, $results);
    }

    /**
     * Get total count of active on demand entries
     * 
     * @return int The total count
     */
    public function getTotalCount(): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as num
            FROM ondemand
        ");
        
        $stmt->execute();
        $row = $stmt->fetch();
        
        return (int)$row['num'];
    }

    /**
     * Add a new on demand entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param array $data The on demand data
     * @return int The ID of the newly created entry
     * @throws \RuntimeException Always throws exception
     */
    public function add(array $data): int {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for creating on-demand entries.'
        );
    }

    /**
     * Update an existing on demand entry
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the on demand entry to update
     * @param array $data The updated on demand data
     * @return bool Whether the update was successful
     * @throws \RuntimeException Always throws exception
     */
    public function update(int $id, array $data): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for updating on-demand entries.'
        );
    }

    /**
     * Delete an on demand entry (soft delete)
     * Note: This is a read-only implementation for PostgreSQL
     * Write operations should go through Payload CMS API
     * 
     * @param int $id The ID of the on demand entry to delete
     * @return bool Whether the deletion was successful
     * @throws \RuntimeException Always throws exception
     */
    public function delete(int $id): bool {
        throw new \RuntimeException(
            'Write operations are not supported in the PostgreSQL read model. ' .
            'Please use Payload CMS admin interface or API for deleting on-demand entries.'
        );
    }

    /**
     * Get all active on demand entries for admin view
     * 
     * @return array Array of on demand entries
     */
    public function getAllForAdmin(): array {
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        // Cloudinary transformations for on-demand images
        $cloudinaryBase = "https://res.cloudinary.com/{$cloudName}/image/upload/c_fill,w_200,h_200,q_auto,f_auto/";
        
        $stmt = $this->db->prepare("
            SELECT 
                o.id,
                o.date,
                CASE 
                    WHEN m.filename IS NOT NULL AND m.filename != '' 
                    THEN '$cloudinaryBase' || m.filename
                    ELSE COALESCE(m.legacy_url, '')
                END as image,
                o.headline,
                o.note,
                o.audio_url,
                COALESCE(o.source, 'opendrive') as source,
                (
                    SELECT string_agg(s.title, ', ' ORDER BY or_songs.order)
                    FROM ondemand_rels or_songs
                    JOIN songs s ON or_songs.songs_id = s.id
                    WHERE or_songs.parent_id = o.id AND or_songs.path = 'songs'
                ) as songs
            FROM ondemand o
            LEFT JOIN media m ON o.image_id = m.id
            ORDER BY o.date DESC
        ");
        
        $stmt->execute();
        
        return $this->formatResults($stmt->fetchAll());
    }

    /**
     * Format PostgreSQL timestamp to MySQL date format (YYYY-MM-DD)
     * 
     * @param string $timestamp PostgreSQL timestamp
     * @return string MySQL date format
     */
    private function formatDate(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('Y-m-d');
    }

    /**
     * Format PostgreSQL timestamp to short date format (mm/dd/yy)
     * 
     * @param string $timestamp PostgreSQL timestamp
     * @return string Short date format
     */
    private function formatDateShort(string $timestamp): string {
        $date = new \DateTime($timestamp);
        return $date->format('m/d/y');
    }

    /**
     * Convert Lexical JSON to plain text
     * Extracts text content from Lexical editor format
     * 
     * @param string|null $lexicalJson The Lexical JSON string
     * @return string Plain text content
     */
    private function lexicalToText(?string $lexicalJson): string {
        if (!$lexicalJson) {
            return '';
        }
        
        $data = json_decode($lexicalJson, true);
        if (!$data || !isset($data['root']['children'])) {
            return '';
        }
        
        $text = [];
        foreach ($data['root']['children'] as $node) {
            if (isset($node['children'])) {
                foreach ($node['children'] as $child) {
                    if (isset($child['text'])) {
                        $text[] = $child['text'];
                    } elseif ($child['type'] === 'link' && isset($child['children'])) {
                        foreach ($child['children'] as $linkChild) {
                            if (isset($linkChild['text'])) {
                                $text[] = $linkChild['text'];
                            }
                        }
                    }
                }
            }
        }
        
        return implode(' ', $text);
    }

    /**
     * Format a single result row
     * 
     * @param array $row Raw database row
     * @return array Formatted row
     */
    private function formatResult(array $row): array {
        if (isset($row['date'])) {
            $row['fdate'] = $this->formatDateShort($row['date']);
            $row['date'] = $this->formatDate($row['date']);
        }
        
        // Convert Lexical JSON note to plain text
        if (isset($row['note'])) {
            $row['note'] = $this->lexicalToText($row['note']);
        }
        
        // Ensure songs is not null
        if (!isset($row['songs']) || $row['songs'] === null) {
            $row['songs'] = '';
        }
        
        return $row;
    }

    /**
     * Format results array to match MySQL output format
     * 
     * @param array $results Raw database results
     * @return array Formatted results
     */
    private function formatResults(array $results): array {
        return array_map([$this, 'formatResult'], $results);
    }
}
