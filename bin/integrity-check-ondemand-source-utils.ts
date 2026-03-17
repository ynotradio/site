/**
 * Utility functions for the OnDemand Source integrity check.
 *
 * Separated from the main script so tests can import without pulling in
 * Payload CMS / @payload-config / MySQL dependencies.
 */

/** Valid Payload source values for the OnDemand collection */
export type PayloadSource = 'opendrive' | 'soundcloud' | 'other';

/**
 * Map a MySQL ondemand.source value to the Payload select field value.
 *
 * MySQL values observed in production: 'opendrive', '4shared', 'soundcloud'.
 * Payload options: 'opendrive' | 'soundcloud' | 'other'.
 */
export function mapMysqlSourceToPayload(mysqlSource: string | null | undefined): PayloadSource {
  const normalized = (mysqlSource ?? '').toLowerCase().trim();
  if (normalized === 'opendrive') return 'opendrive';
  if (normalized === 'soundcloud') return 'soundcloud';
  return 'other';
}
