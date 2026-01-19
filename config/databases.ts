/**
 * Centralized database configuration for import scripts
 *
 * This module provides clear, explicit database connection configuration
 * replacing the ambiguous --env dev|prod flags with explicit --from/--to targets.
 *
 * Database Targets:
 * - local-mysql: Local Docker MySQL container (for development)
 * - prod-mysql: Production MySQL (read-only, for imports)
 * - local-postgres: Local PostgreSQL (for development)
 * - prod-neon: Production Neon PostgreSQL (import target, safe until feature flags flip)
 *
 * Environment Files:
 * - .env.local: Local development (Docker containers)
 * - .env.production.mysql: Production MySQL credentials (read-only)
 *
 * The Payload CMS connection is configured separately via .env.local
 * using DATABASE_URI, NEON_DEV_DATABASE_URL, and NEON_PROD_DATABASE_URL
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MySQL connection source types for import scripts
 */
export type MySQLSource = 'local-mysql' | 'prod-mysql';

/**
 * PostgreSQL/Neon target types for import scripts
 */
export type PostgresTarget = 'local-postgres' | 'prod-neon';

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
 * Load environment variables from the appropriate .env file
 */
function loadEnvFile(filename: string): void {
  const envPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    // eslint-disable-next-line no-console
    console.log(`Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath, override: true });
  }
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

  if (source === 'prod-mysql') {
    // For production MySQL, also load .env.production.mysql if it exists
    // This allows overriding with production MySQL credentials
    const prodMysqlEnv = path.resolve(process.cwd(), '.env.production.mysql');
    if (fs.existsSync(prodMysqlEnv)) {
      loadEnvFile('.env.production.mysql');
    }

    // Require PROD_MYSQL_* environment variables for production
    const host = process.env.PROD_MYSQL_HOST;
    const database = process.env.PROD_MYSQL_DATABASE || process.env.DB_NAME;
    const user = process.env.PROD_MYSQL_USER;
    const password = process.env.PROD_MYSQL_PASSWORD;
    const port = process.env.PROD_MYSQL_PORT
      ? parseInt(process.env.PROD_MYSQL_PORT, 10)
      : undefined;

    if (!host || !user || !password) {
      throw new Error(
        'Production MySQL credentials not configured. '
          + 'Please set PROD_MYSQL_HOST, PROD_MYSQL_USER, and PROD_MYSQL_PASSWORD '
          + 'in .env.production.mysql or environment variables.',
      );
    }

    return {
      host,
      database: database || 'ynot_site',
      user,
      password,
      port,
    };
  }

  // Local MySQL (Docker)
  return {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ynot_site',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
}

/**
 * Get the Neon database URL for the specified target
 *
 * @param target - 'local-postgres' or 'prod-neon'
 * @returns Database connection string
 */
export function getNeonDatabaseUrl(target: PostgresTarget): string {
  // Load .env.local for Neon URLs
  loadEnvFile('.env.local');

  if (target === 'prod-neon') {
    const url = process.env.NEON_PROD_DATABASE_URL;
    if (!url) {
      throw new Error(
        'Production Neon URL not configured. '
          + 'Please set NEON_PROD_DATABASE_URL in .env.local',
      );
    }
    return url;
  }

  // Local postgres or dev neon
  const url = process.env.NEON_DEV_DATABASE_URL || process.env.DATABASE_URI;
  if (!url) {
    throw new Error(
      'Development database URL not configured. '
        + 'Please set DATABASE_URI or NEON_DEV_DATABASE_URL in .env.local',
    );
  }
  return url;
}

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

  return {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ynot_site',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
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
  let to: PostgresTarget = 'prod-neon';

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
      const value = args[i + 1];
      if (value !== 'local-postgres' && value !== 'prod-neon') {
        throw new Error('--to must be "local-postgres" or "prod-neon"');
      }
      to = value;
      i += 2; // Skip both --to and its value
    } else {
      i += 1; // Move to next argument
    }
  }

  return { from, to };
}

/**
 * Convert legacy --env flag to new --from/--to format
 *
 * This provides backward compatibility during the transition period.
 * --env dev  -> --from local-mysql --to prod-neon (matches current behavior)
 * --env prod -> --from prod-mysql --to prod-neon
 *
 * @param args - Command line arguments
 * @returns Parsed from/to configuration
 */
export function parseLegacyEnvArg(args: string[]): {
  from: MySQLSource;
  to: PostgresTarget;
} {
  let from: MySQLSource = 'local-mysql';
  const to: PostgresTarget = 'prod-neon';

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--env') {
      const value = args[i + 1];
      if (value === 'prod') {
        from = 'prod-mysql';
      }
      // 'dev' keeps from as 'local-mysql'
      i += 2; // Skip both --env and its value
    } else {
      i += 1; // Move to next argument
    }
  }

  return { from, to };
}
