/**
 * Migration configuration - re-exports from centralized database config
 *
 * This file maintains backward compatibility with existing import scripts.
 * New scripts should import directly from 'config/databases.ts'.
 *
 * @deprecated Import from 'config/databases.ts' instead
 */

import { getLegacyDbConfig, migrationConfig as centralMigrationConfig } from '../../config/databases';

// Database configuration (uses legacy loading for backward compatibility)
export const dbConfig = getLegacyDbConfig();

// Migration settings
export const migrationConfig = centralMigrationConfig;
