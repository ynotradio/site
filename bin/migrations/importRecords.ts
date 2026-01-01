#!/usr/bin/env tsx
/**
 * Import records (albums) from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importRecords.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveRecords, type Record } from './database';
import { getPayloadClient, findOrCreateArtist } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('RecordsImport');

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
Usage: tsx bin/migrations/importRecords.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importRecords.ts --env dev
  tsx bin/migrations/importRecords.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a record with the given legacy ID already exists
 */
async function recordExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'records',
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
 * Import a single record
 */
async function importRecord(payload: Payload, record: Record): Promise<boolean> {
  try {
    // Check if already imported
    if (await recordExists(payload, record.id)) {
      logger.debug(`Record ${record.id} already exists, skipping`);
      return false;
    }

    // Skip records without artist information
    if (!record.artist_id || !record.artist_name) {
      logger.warn(`Record ${record.id} has no artist information, skipping`);
      return false;
    }

    // Find or create artist
    const artistId = await findOrCreateArtist(payload, record.artist_name, record.artist_id);

    // Generate slug from title
    const slug = record.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create record
    await payload.create({
      collection: 'records',
      data: {
        title: record.title,
        slug,
        artist: artistId as any,
        label: record.label || undefined,
        releaseDate: record.release_date || undefined,
        legacyId: record.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported record ${record.id}: ${record.title}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import record ${record.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importRecords(options: ImportOptions): Promise<void> {
  logger.info('Starting records import...');
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

    // Fetch records from MySQL
    logger.info('Fetching records from MySQL...');
    const records = await getActiveRecords(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = records.length;
    logger.info(`Found ${stats.total} records to import`);

    // Import each record
    for (let i = 0; i < records.length; i += 1) {
      const record = records[i];

      const imported = await importRecord(payload, record);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === records.length - 1) {
        logProgress(i + 1, records.length, `Record ${record.id}`);
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
  logger.info('Records import completed');
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
  importRecords(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importRecords, parseArgs, importRecord };
