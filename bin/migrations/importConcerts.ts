#!/usr/bin/env tsx
/**
 * Import concerts from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importConcerts.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional concert ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveConcerts, type Concert } from './database';
import { getPayloadClient, findOrCreateArtist, findOrCreateVenue } from './shared/payloadClient';
import { processArtistString } from './shared/artistCleaner';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('ConcertImport');

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
Usage: tsx bin/migrations/importConcerts.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional concert ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importConcerts.ts --env dev
  tsx bin/migrations/importConcerts.ts --env prod --start-id 1000
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a concert with the given legacy ID already exists
 */
async function concertExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'concerts',
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
 * Import a single concert record
 */
async function importConcert(payload: Payload, concert: Concert): Promise<boolean> {
  try {
    // Check if already imported
    if (await concertExists(payload, concert.id)) {
      logger.debug(`Concert ${concert.id} already exists, skipping`);
      return false;
    }

    // Process artist string to extract artist names and custom title (if event/special show)
    const { artistNames, customTitle } = processArtistString(concert.artist);

    if (artistNames.length === 0) {
      logger.warn(`Concert ${concert.id} has no valid artist names, skipping`);
      return false;
    }

    // Create or find all artists
    const artistIds = await Promise.all(
      artistNames.map((name) => findOrCreateArtist(payload, name)),
    );

    // Note: band_pic_url is not imported here as it's specific to this concert
    // and could conflict with artist photos from other sources.
    // Artist photos should be imported separately or via a dedicated artist photo import.

    // Find or create venue
    const venueId = await findOrCreateVenue(payload, concert.venue);

    // Only use customTitle if it exists (for events/special shows)
    // Otherwise leave title undefined/null so it can be generated from artist names
    const title = customTitle || undefined;

    // Create concert record
    await payload.create({
      collection: 'concerts',
      data: {
        title,
        date: concert.date,
        artists: artistIds as any,
        venue: venueId as any,
        ticketInfo: concert.ticketinfo || undefined,
        ticketUrl: concert.ticketurl || undefined,
        featured: concert.featured === 'Yes',
        legacyId: concert.id,
        migratedAt: new Date().toISOString(),
      },
    });

    const displayName = title || artistNames.join(', ');
    logger.debug(`Imported concert ${concert.id}: ${displayName} at ${concert.venue}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import concert ${concert.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importConcerts(options: ImportOptions): Promise<void> {
  logger.info('Starting concert import...');
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

    // Fetch concerts from MySQL
    logger.info('Fetching concerts from MySQL...');
    const concerts = await getActiveConcerts(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = concerts.length;
    logger.info(`Found ${stats.total} concerts to import`);

    // Import each concert
    // Note: Sequential processing ensures data consistency and makes errors easier to debug.
    // For better performance on large datasets, consider processing in batches with
    // Promise.allSettled() while maintaining error isolation.
    for (let i = 0; i < concerts.length; i += 1) {
      const concert = concerts[i];

      const imported = await importConcert(payload, concert);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === concerts.length - 1) {
        logProgress(i + 1, concerts.length, `Concert ${concert.id}`);
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
  logger.info('Concert import completed');
}

/**
 * Check if this file is being run directly
 * Works with both CommonJS and ESM module systems
 */
function isMainModule(): boolean {
  // ESM check
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    // In ESM, compare the import.meta.url with the file URL
    return import.meta.url === `file://${process.argv[1]}`;
  }
  // CommonJS fallback
  return require.main === module;
}

// Run the import when executed directly
if (isMainModule()) {
  const options = parseArgs();
  importConcerts(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importConcerts, parseArgs, importConcert };
