/**
 * Utility functions for the Publish Status integrity check.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config / MySQL dependencies.
 */

/**
 * Determine whether a MySQL record is "live" (not soft-deleted).
 *
 * For stories and ondemand tables, `deleted` is 'y'/'Y'/'yes' when removed.
 * Everything else (including 'n', 'N', 'no', empty, null) means live.
 */
export function isMysqlRecordLive(deleted: string | null | undefined): boolean {
  if (!deleted) return true;
  const normalized = deleted.toLowerCase().trim();
  return normalized !== 'y' && normalized !== 'yes';
}

/**
 * Determine the MySQL table and real row ID for a given Payload Posts legacyId.
 *
 * During migration, custom_text records get legacyId = original_id + 10000.
 * Stories keep their original id.
 */
export function resolvePostLegacyId(legacyId: number): {
  table: 'stories' | 'custom_texts';
  mysqlId: number;
} {
  if (legacyId >= 10000) {
    return { table: 'custom_texts', mysqlId: legacyId - 10000 };
  }
  return { table: 'stories', mysqlId: legacyId };
}
