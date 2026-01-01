#!/usr/bin/env tsx
/**
 * Import songs from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importSongs.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveSongs, type Song } from './database';
import { getPayloadClient, findOrCreateArtist } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('SongsImport');

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
Usage: tsx bin/migrations/importSongs.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importSongs.ts --env dev
  tsx bin/migrations/importSongs.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a song with the given legacy ID already exists
 */
async function songExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'songs',
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
 * Import a single song record
 */
async function importSong(payload: Payload, song: Song): Promise<boolean> {
  try {
    // Check if already imported
    if (await songExists(payload, song.id)) {
      logger.debug(`Song ${song.id} already exists, skipping`);
      return false;
    }

    // Find or create artist if artist_id and artist_name are available
    let artistId;
    if (song.artist_id && song.artist_name) {
      artistId = await findOrCreateArtist(payload, song.artist_name, song.artist_id);
    }

    // Generate slug from title
    const slug = song.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create song record
    await payload.create({
      collection: 'songs',
      data: {
        title: song.title,
        slug,
        artist: artistId ? (artistId as any) : undefined,
        streamUrl: song.stream_url || undefined,
        releaseDate: song.release_date || undefined,
        featureOnNewMusic: song.feature_on_new_music === 'Yes',
        legacyId: song.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported song ${song.id}: ${song.title}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import song ${song.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importSongs(options: ImportOptions): Promise<void> {
  logger.info('Starting songs import...');
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

    // Fetch songs from MySQL
    logger.info('Fetching songs from MySQL...');
    const songs = await getActiveSongs(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = songs.length;
    logger.info(`Found ${stats.total} songs to import`);

    // Import each song
    for (let i = 0; i < songs.length; i += 1) {
      const song = songs[i];

      const imported = await importSong(payload, song);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === songs.length - 1) {
        logProgress(i + 1, songs.length, `Song ${song.id}`);
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
  logger.info('Songs import completed');
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
  importSongs(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importSongs, parseArgs, importSong };
