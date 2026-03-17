#!/usr/bin/env tsx
/**
 * Import music (songs) from MySQL to Payload CMS PostgreSQL database
 *
 * This script imports songs from the MySQL 'music' table and dynamically
 * creates artist records as needed.
 *
 * Usage:
 *   tsx bin/migrations/importMusic.ts --to prod-neon --start-id 100
 *
 * Options:
 *   --to        Target database: 'prod-neon' (default) or 'local-postgres'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import * as mysql from 'mysql2/promise';
import { connectToDatabase } from './database';
import { getPayloadClient, findOrCreateArtist } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { PostgresTarget } from './shared/payloadClient';
import { slugifyText, buildMusicSlug } from '../../payload/src/collections/hooks/musicSlugify';

const logger = createLogger('MusicImport');

interface Music {
  id: number;
  artist: string;
  song: string;
  url: string;
  date: string;
  deleted: string;
}

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface ImportOptions {
  to: PostgresTarget;
  startId?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    to: 'prod-neon',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--to') {
      const toValue = args[i + 1];
      if (toValue !== 'prod-neon' && toValue !== 'local-postgres') {
        throw new Error('--to must be "prod-neon" or "local-postgres"');
      }
      options.to = toValue;
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
Usage: tsx bin/migrations/importMusic.ts [options]

Options:
  --to TARGET      Target database: 'prod-neon' (default) or 'local-postgres'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importMusic.ts --to prod-neon
  tsx bin/migrations/importMusic.ts --to local-postgres --start-id 1000
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Fetch active music records from MySQL
 */
async function getActiveMusic(
  connection: mysql.Connection,
  options: { startId?: number } = {},
): Promise<Music[]> {
  try {
    let query = "SELECT * FROM music WHERE deleted = 'n'";
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} music records from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Music[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
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
 * Import a single music record, creating artist if needed
 */
async function importMusic(
  payload: Payload,
  music: Music,
): Promise<'imported' | 'skipped' | 'error'> {
  try {
    // Check if already imported
    if (await songExists(payload, music.id)) {
      logger.debug(`Song ${music.id} already exists, skipping`);
      return 'skipped';
    }

    // Find or create artist
    const artistId = await findOrCreateArtist(payload, music.artist);

    // Pre-compute the slug so musicSlugify returns synchronously.
    // Payload's generateSlug wrapper does NOT await async slugify results, so we must
    // provide a pre-computed slug to avoid the Promise-as-value race condition.
    const titleSlug = slugifyText(String(music.song));
    const slug = titleSlug ? buildMusicSlug(music.artist, titleSlug) : `legacy-song-${music.id}`;

    await payload.create({
      collection: 'songs',
      data: {
        title: music.song,
        artist: artistId as any,
        streamUrl: music.url || undefined,
        releaseDate: music.date,
        featureOnNewMusic: true, // Assume all imported songs were featured
        legacyId: music.id,
        migratedAt: new Date().toISOString(),
        slug,
      },
    });

    logger.debug(`Imported song ${music.id}: ${music.artist} - ${music.song}`);
    return 'imported';
  } catch (error) {
    logger.error(`Failed to import song ${music.id}`, error as Error);
    return 'error';
  }
}

/**
 * Main import function
 */
async function importAllMusic(options: ImportOptions): Promise<void> {
  logger.info('Starting music import...');
  logger.info(`Target: ${options.to}`);
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
    payload = await getPayloadClient(options.to);

    // Fetch music from MySQL
    logger.info('Fetching music records from MySQL...');
    const musicRecords = await getActiveMusic(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = musicRecords.length;
    logger.info(`Found ${stats.total} music records to import`);

    // Import each song
    for (let i = 0; i < musicRecords.length; i += 1) {
      const music = musicRecords[i];

      const result = await importMusic(payload, music);

      if (result === 'imported') {
        stats.success += 1;
      } else if (result === 'error') {
        stats.errors += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === musicRecords.length - 1) {
        logProgress(i + 1, musicRecords.length, `Song ${music.id}`);
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
  logger.info('Music import completed');
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
  importAllMusic(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export {
  importAllMusic, parseArgs, importMusic, getActiveMusic,
};
