/**
 * Centralized database configuration for import scripts
 *
 * This module provides clear, explicit database connection configuration
 * replacing provider-specific target names with provider-neutral --from/--to targets.
 *
 * Database Targets:
 * - local-mysql: Local Docker MySQL container (for development)
 * - prod-mysql: Production MySQL (read-only, for imports)
 * - local-postgres: Local PostgreSQL (for development)
 * - production-db: Production PostgreSQL target (Neon today, Netlify Database during cutover)
 * - preview-db: Preview / staging PostgreSQL target used for deploy previews and integrity checks
 *
 * Environment Files:
 * - .env.local: Local development (Docker containers)
 * - .env.production.mysql: Production MySQL credentials (read-only)
 *
 * The Payload CMS runtime connection is configured via DATABASE_URI.
 * Explicit automation targets use PRODUCTION_DATABASE_URL and PREVIEW_DATABASE_URL.
 * NEON_* variables remain as temporary compatibility fallbacks during cutover.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MySQL connection source types for import scripts
 */
export type MySQLSource = 'local-mysql' | 'prod-mysql';

/**
 * PostgreSQL target types for import scripts
 */
export type PostgresTarget = 'local-postgres' | 'production-db' | 'preview-db';
export type LegacyPostgresTarget = 'prod-neon' | 'dev-neon' | 'prod' | 'dev';
export type SupportedPostgresTarget = PostgresTarget | LegacyPostgresTarget;

/**
 * MySQL connection configuration
 */
export interface MySQLConfig {
  host: string;
  database: string;
  user: string;
  password: string;
  port?: number;
}

/**
 * Capture shell environment variables before dotenv loads
 * These take precedence over .env file values
 */
const shellEnvOverrides: Record<string, string> = {};
const overridableVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'DB_PORT',
  'DATABASE_URI',
  'LOCAL_DATABASE_URL',
  'PREVIEW_DATABASE_URL',
  'PRODUCTION_DATABASE_URL',
  'NEON_DEV_DATABASE_URL',
  'NEON_PROD_DATABASE_URL',
];
overridableVars.forEach((key) => {
  if (process.env[key] !== undefined) {
    shellEnvOverrides[key] = process.env[key] as string;
  }
});

/**
 * Load environment variables from the appropriate .env file
 */
function loadEnvFile(filename: string): void {
  const envPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    // eslint-disable-next-line no-console
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath, override: true });

    // Restore shell environment overrides (shell takes precedence)
    Object.entries(shellEnvOverrides).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }
}

/**
 * Get production MySQL configuration
 */
function getProductionMysqlConfig(): MySQLConfig {
  const prodMysqlEnv = path.resolve(process.cwd(), '.env.production.mysql');
  if (fs.existsSync(prodMysqlEnv)) {
    loadEnvFile('.env.production.mysql');
  }

  const host = process.env.PROD_MYSQL_HOST;
  const database = process.env.PROD_MYSQL_DATABASE || process.env.DB_NAME || 'ynot_site';
  const user = process.env.PROD_MYSQL_USER;
  const password = process.env.PROD_MYSQL_PASSWORD;
  const port = process.env.PROD_MYSQL_PORT ? parseInt(process.env.PROD_MYSQL_PORT, 10) : undefined;

  if (!host || !user || !password) {
    throw new Error(
      'Production MySQL credentials not configured. '
        + 'Please set PROD_MYSQL_HOST, PROD_MYSQL_USER, and PROD_MYSQL_PASSWORD '
        + 'in .env.production.mysql or environment variables.',
    );
  }

  return {
    host, database, user, password, port,
  };
}

/**
 * Get local MySQL configuration
 */
function getLocalMysqlConfig(): MySQLConfig {
  return {
    host: process.env.IMPORT_DB_HOST || process.env.DB_HOST || 'localhost',
    database: process.env.IMPORT_DB_NAME || process.env.DB_NAME || 'ynot_site',
    user: process.env.IMPORT_DB_USER || process.env.DB_USER || 'root',
    password: process.env.IMPORT_DB_PASSWORD || process.env.DB_PASSWORD || '',
    port: process.env.IMPORT_DB_PORT ? parseInt(process.env.IMPORT_DB_PORT, 10) : undefined,
  };
}

/**
 * Get MySQL configuration for the specified source
 *
 * @param source - 'local-mysql' for Docker MySQL, 'prod-mysql' for production
 * @returns MySQL connection configuration
 */
export function getMySQLConfig(source: MySQLSource): MySQLConfig {
  // Load base .env.local for local MySQL config
  loadEnvFile('.env.local');

  return source === 'prod-mysql' ? getProductionMysqlConfig() : getLocalMysqlConfig();
}

/**
 * Normalize legacy target aliases to provider-neutral target names
 *
 * @param target - supported target or legacy alias
 * @returns Normalized target name
 */
export function normalizePostgresTarget(target: SupportedPostgresTarget): PostgresTarget {
  if (target === 'prod-neon' || target === 'prod') {
    return 'production-db';
  }

  if (target === 'dev-neon' || target === 'dev') {
    return 'preview-db';
  }

  return target;
}

/**
 * Get the database URL for the specified target
 *
 * @param target - supported target or legacy alias
 * @returns Database connection string
 */
export function getDatabaseUrl(target: SupportedPostgresTarget): string {
  // Load .env.local for database URLs
  loadEnvFile('.env.local');

  const normalizedTarget = normalizePostgresTarget(target);

  if (normalizedTarget === 'production-db') {
    const url = process.env.PRODUCTION_DATABASE_URL || process.env.NEON_PROD_DATABASE_URL;
    if (!url) {
      throw new Error(
        'Production database URL not configured. '
          + 'Please set PRODUCTION_DATABASE_URL (preferred) or NEON_PROD_DATABASE_URL in .env.local',
      );
    }
    return url;
  }

  if (normalizedTarget === 'preview-db') {
    const url = process.env.PREVIEW_DATABASE_URL || process.env.NEON_DEV_DATABASE_URL;
    if (!url) {
      throw new Error(
        'Preview database URL not configured. '
          + 'Please set PREVIEW_DATABASE_URL (preferred) or NEON_DEV_DATABASE_URL in .env.local',
      );
    }
    return url;
  }

  // Local postgres
  const url = process.env.LOCAL_DATABASE_URL
    || process.env.DATABASE_URI
    || process.env.PREVIEW_DATABASE_URL
    || process.env.NEON_DEV_DATABASE_URL;
  if (!url) {
    throw new Error(
      'Local database URL not configured. '
        + 'Please set LOCAL_DATABASE_URL, DATABASE_URI, PREVIEW_DATABASE_URL, '
        + 'or NEON_DEV_DATABASE_URL in .env.local',
    );
  }
  return url;
}

/**
 * @deprecated Temporary compatibility export during the database provider cutover.
 * Prefer getDatabaseUrl in new code.
 */
export const getNeonDatabaseUrl = getDatabaseUrl;

/**
 * Legacy compatibility: Get dbConfig for existing scripts
 *
 * This maintains backward compatibility with existing import scripts
 * that use the dbConfig export. New scripts should use getMySQLConfig().
 *
 * @deprecated Use getMySQLConfig('local-mysql') instead
 */
export function getLegacyDbConfig(): MySQLConfig {
  // Load environment from the legacy paths for backward compatibility
  const legacyPaths = [
    path.resolve(process.cwd(), 'bin', 'migrations', '.env'),
    path.resolve(process.cwd(), 'src', 'partials', '.env'),
    path.resolve(process.cwd(), '.env.local'),
  ];

  // Find first existing path and load it
  const envPath = legacyPaths.find((p) => fs.existsSync(p));
  if (envPath) {
    // eslint-disable-next-line no-console
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
  }

  // Use IMPORT_DB_* for import scripts (connect from host machine via localhost)
  // Fall back to DB_* for compatibility with Docker PHP site
  return {
    host: process.env.IMPORT_DB_HOST || process.env.DB_HOST || 'localhost',
    database: process.env.IMPORT_DB_NAME || process.env.DB_NAME || 'ynot_site',
    user: process.env.IMPORT_DB_USER || process.env.DB_USER || 'root',
    password: process.env.IMPORT_DB_PASSWORD || process.env.DB_PASSWORD || '',
    port: process.env.IMPORT_DB_PORT ? parseInt(process.env.IMPORT_DB_PORT, 10) : undefined,
  };
}

/**
 * Migration settings (unchanged from original)
 */
export const migrationConfig = {
  baseUrl: 'https://www.ynotradio.net/',
};

/**
 * Parse --from and --to CLI arguments
 *
 * @param args - Command line arguments (process.argv.slice(2))
 * @returns Parsed from/to configuration
 */
export function parseFromToArgs(args: string[]): {
  from: MySQLSource;
  to: PostgresTarget;
} {
  let from: MySQLSource = 'local-mysql';
  let to: PostgresTarget = 'production-db';

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--from') {
      const value = args[i + 1];
      if (value !== 'local-mysql' && value !== 'prod-mysql') {
        throw new Error('--from must be "local-mysql" or "prod-mysql"');
      }
      from = value;
      i += 2; // Skip both --from and its value
    } else if (arg === '--to') {
      const value = args[i + 1] as SupportedPostgresTarget | undefined;
      if (
        value !== 'local-postgres'
        && value !== 'production-db'
        && value !== 'preview-db'
        && value !== 'prod-neon'
        && value !== 'dev-neon'
        && value !== 'prod'
        && value !== 'dev'
      ) {
        throw new Error(
          '--to must be "local-postgres", "production-db", or "preview-db" '
            + '(legacy aliases: "prod-neon", "dev-neon", "prod", "dev")',
        );
      }
      to = normalizePostgresTarget(value);
      i += 2; // Skip both --to and its value
    } else {
      i += 1; // Move to next argument
    }
  }

  return { from, to };
}
