#!/usr/bin/env tsx
/**
 * Import venues from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importVenues.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveVenues, type Venue } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { generateSlug } from './shared/importUtils';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('VenuesImport');

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
Usage: tsx bin/migrations/importVenues.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importVenues.ts --env dev
  tsx bin/migrations/importVenues.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a venue with the given legacy ID already exists
 */
async function venueExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'venues',
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
 * Import a single venue record
 */
async function importVenue(payload: Payload, venue: Venue): Promise<boolean> {
  try {
    // Check if already imported
    if (await venueExists(payload, venue.id)) {
      logger.debug(`Venue ${venue.id} already exists, skipping`);
      return false;
    }

    // Generate slug from name
    const slug = generateSlug(venue.name);

    // Create venue record
    await payload.create({
      collection: 'venues',
      data: {
        name: venue.name,
        slug,
        address: venue.address || undefined,
        city: venue.city || undefined,
        website: venue.website || undefined,
        legacyId: venue.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported venue ${venue.id}: ${venue.name}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import venue ${venue.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importVenues(options: ImportOptions): Promise<void> {
  logger.info('Starting venues import...');
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

    // Fetch venues from MySQL
    logger.info('Fetching venues from MySQL...');
    const venues = await getActiveVenues(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = venues.length;
    logger.info(`Found ${stats.total} venues to import`);

    // Import each venue
    for (let i = 0; i < venues.length; i += 1) {
      const venue = venues[i];

      const imported = await importVenue(payload, venue);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === venues.length - 1) {
        logProgress(i + 1, venues.length, `Venue ${venue.id}`);
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
  logger.info('Venues import completed');
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
  importVenues(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importVenues, parseArgs, importVenue };
