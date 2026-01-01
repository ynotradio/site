#!/usr/bin/env tsx
/**
 * Import artists from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importArtists.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveArtists, type Artist } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { getArtistMbid } from './shared/musicbrainz';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('ArtistsImport');

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
Usage: tsx bin/migrations/importArtists.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importArtists.ts --env dev
  tsx bin/migrations/importArtists.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if an artist with the given legacy ID already exists
 */
async function artistExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'artists',
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
 * Import a single artist record
 */
async function importArtist(payload: Payload, artist: Artist): Promise<boolean> {
  try {
    // Check if already imported
    if (await artistExists(payload, artist.id)) {
      logger.debug(`Artist ${artist.id} already exists, skipping`);
      return false;
    }

    // Generate slug from name
    const slug = artist.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Try to fetch MusicBrainz ID
    let mbid = null;
    try {
      mbid = await getArtistMbid(artist.name);
      if (mbid) {
        logger.debug(`Found MusicBrainz ID for ${artist.name}: ${mbid}`);
      }
    } catch (error) {
      // Log but don't fail if MusicBrainz lookup fails
      logger.debug(`MusicBrainz lookup failed for ${artist.name}`);
    }

    // Create artist record
    await payload.create({
      collection: 'artists',
      data: {
        name: artist.name,
        slug,
        bio: artist.bio || undefined,
        website: artist.website || undefined,
        musicbrainzId: mbid || undefined,
        legacyId: artist.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported artist ${artist.id}: ${artist.name}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import artist ${artist.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importArtists(options: ImportOptions): Promise<void> {
  logger.info('Starting artists import...');
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

    // Fetch artists from MySQL
    logger.info('Fetching artists from MySQL...');
    const artists = await getActiveArtists(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = artists.length;
    logger.info(`Found ${stats.total} artists to import`);

    // Import each artist
    for (let i = 0; i < artists.length; i += 1) {
      const artist = artists[i];

      const imported = await importArtist(payload, artist);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === artists.length - 1) {
        logProgress(i + 1, artists.length, `Artist ${artist.id}`);
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
  logger.info('Artists import completed');
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
  importArtists(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importArtists, parseArgs, importArtist };
