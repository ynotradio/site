<?php

/**
 * Payload CMS admin link helpers.
 *
 * Provides functions to construct links between the PHP control panel and the
 * Payload CMS admin UI so that editors can jump directly from a legacy record
 * to its imported counterpart.
 */

require_once __DIR__ . '/../lib/Database.php';

/**
 * Return the Payload admin base URL (no trailing slash), e.g. "http://localhost:3000/admin".
 */
function get_payload_admin_url(): string {
    $base = $_ENV['PAYLOAD_PUBLIC_SERVER_URL'] ?? getenv('PAYLOAD_PUBLIC_SERVER_URL') ?: 'https://ynotradio-admin.netlify.app';
    return rtrim($base, '/') . '/admin';
}

/**
 * Return the Payload collection list URL, e.g. "/admin/collections/ads".
 */
function get_payload_collection_url(string $collection): string {
    return get_payload_admin_url() . '/collections/' . $collection;
}

/**
 * Look up the Payload document UUID for a record with the given legacy MySQL ID.
 *
 * Returns null when the record has not been imported yet or if the PostgreSQL
 * connection is unavailable.
 *
 * @param string $pg_table  PostgreSQL table name (matches Payload collection slug)
 * @param int    $legacy_id MySQL primary key stored in the legacy_id column
 */
function get_payload_id_by_legacy_id(string $pg_table, int $legacy_id): ?string {
    static $ALLOWED_TABLES = [
        'ads', 'cdoftheweek', 'concerts', 'djs', 'media',
        'ondemand', 'people', 'posts', 'records', 'shows', 'songs',
    ];

    if (!in_array($pg_table, $ALLOWED_TABLES, true)) {
        error_log('Payload link lookup: unknown table "' . $pg_table . '"');
        return null;
    }

    try {
        $db = \YNotRadio\Lib\Database::getPostgres();
        // Table name is validated against the allowlist above before this point.
        $stmt = $db->prepare('SELECT id FROM "' . $pg_table . '" WHERE legacy_id = :legacy_id LIMIT 1');
        $stmt->execute([':legacy_id' => $legacy_id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ? (string) $row['id'] : null;
    } catch (\Exception $e) {
        error_log('Payload link lookup failed [' . $pg_table . ' legacy_id=' . $legacy_id . ']: ' . $e->getMessage());
        return null;
    }
}

/**
 * Return the Payload document edit URL for a record identified by its legacy MySQL ID.
 *
 * Returns null when the record has not been imported (no matching Payload document).
 *
 * @param string $collection Payload collection slug, e.g. "ads"
 * @param string $pg_table   PostgreSQL table name, e.g. "ads"
 * @param int    $legacy_id  MySQL primary key
 */
function get_payload_edit_url(string $collection, string $pg_table, int $legacy_id): ?string {
    $payload_id = get_payload_id_by_legacy_id($pg_table, $legacy_id);
    if ($payload_id === null) {
        return null;
    }
    return get_payload_admin_url() . '/collections/' . $collection . '/' . $payload_id;
}
