#!/usr/bin/env tsx
/**
 * Import shows (schedule) from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importShows.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveShows, type Show } from './database';
import { getPayloadClient, findDJByLegacyId } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('ShowsImport');

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface ImportOptions {
  env: DatabaseEnv;
  startId?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    env: 'dev',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--env') {
      const envValue = args[i + 1];
      if (envValue !== 'dev' && envValue !== 'prod') {
        throw new Error('--env must be either "dev" or "prod"');
      }
      options.env = envValue;
      i += 1;
    } else if (arg === '--start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--start-id must be a positive number');
      }
      options.startId = startId;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/importShows.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importShows.ts --env dev
  tsx bin/migrations/importShows.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a show with the given legacy ID already exists
 */
async function showExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'shows',
    where: {
      legacyId: {
        equals: legacyId,
      },
    },
    limit: 1,
  });

  return existing.docs.length > 0;
}

/**
 * Import a single show record
 */
async function importShow(payload: Payload, show: Show): Promise<boolean> {
  try {
    // Check if already imported
    if (await showExists(payload, show.id)) {
      logger.debug(`Show ${show.id} already exists, skipping`);
      return false;
    }

    // Find DJ by legacy ID
    if (!show.dj_id) {
      logger.warn(`Show ${show.id} has no DJ ID, skipping`);
      return false;
    }

    const djId = await findDJByLegacyId(payload, show.dj_id);
    if (!djId) {
      logger.warn(`Show ${show.id} references DJ ${show.dj_id} which does not exist, skipping`);
      return false;
    }

    // Create show record
    await payload.create({
      collection: 'shows',
      data: {
        date: show.date,
        day: show.day.toLowerCase(),
        startTime: show.start_time,
        endTime: show.end_time,
        host: djId as any,
        note: show.note || undefined,
        legacyId: show.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported show ${show.id} on ${show.day}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import show ${show.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importShows(options: ImportOptions): Promise<void> {
  logger.info('Starting shows import...');
  logger.info(`Environment: ${options.env}`);
  if (options.startId) {
    logger.info(`Starting from ID: ${options.startId}`);
  }

  const stats: ImportStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  let mysqlConnection;
  let payload;

  try {
    // Connect to MySQL (source)
    logger.info('Connecting to MySQL database...');
    mysqlConnection = await connectToDatabase();

    // Connect to Payload (destination)
    payload = await getPayloadClient(options.env);

    // Fetch shows from MySQL
    logger.info('Fetching shows from MySQL...');
    const shows = await getActiveShows(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = shows.length;
    logger.info(`Found ${stats.total} shows to import`);

    // Import each show
    for (let i = 0; i < shows.length; i += 1) {
      const show = shows[i];

      const imported = await importShow(payload, show);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === shows.length - 1) {
        logProgress(i + 1, shows.length, `Show ${show.id}`);
      }
    }
  } catch (error) {
    logger.error('Import failed', error as Error);
    throw error;
  } finally {
    // Close MySQL connection
    if (mysqlConnection) {
      await mysqlConnection.end();
      logger.info('MySQL connection closed');
    }
  }

  // Log summary
  logSummary(stats);
  logger.info('Shows import completed');
}

/**
 * Check if this file is being run directly
 */
function isMainModule(): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return import.meta.url === `file://${process.argv[1]}`;
  }
  return require.main === module;
}

// Run the import when executed directly
if (isMainModule()) {
  const options = parseArgs();
  importShows(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importShows, parseArgs, importShow };
