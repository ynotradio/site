#!/usr/bin/env tsx
/**
 * Import on-demand content from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importOnDemand.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveOnDemand, type OnDemand } from './database';
import { getPayloadClient, findOrCreateArtist } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import { processArtistString } from './shared/artistCleaner';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('OnDemandImport');

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
Usage: tsx bin/migrations/importOnDemand.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importOnDemand.ts --env dev
  tsx bin/migrations/importOnDemand.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if an on-demand item with the given legacy ID already exists
 */
async function onDemandExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'ondemand',
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
 * Parse song titles from the songs field
 * Handles delimiters: " / " and ", "
 */
function parseSongTitles(songsText: string | null | undefined): string[] {
  if (!songsText || songsText.trim() === '' || songsText.toLowerCase().trim() === 'n/a') {
    return [];
  }

  // Split by " / " or ", " (prioritize " / " as it's more specific)
  const delimiter = songsText.includes(' / ') ? ' / ' : ', ';
  const titles = songsText.split(delimiter)
    .map((title) => title.trim())
    .filter((title) => title && title.toLowerCase() !== 'n/a');

  return titles;
}

/**
 * Find or create a song in the songs collection
 */
async function findOrCreateSong(
  payload: Payload,
  title: string,
  artistId: string | null,
): Promise<string | null> {
  try {
    // Search for existing song by title
    const existing = await payload.find({
      collection: 'songs',
      where: {
        title: {
          equals: title,
        },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      return existing.docs[0].id;
    }

    // Create new song - only include artist if we have one
    const songData: any = {
      title,
    };
    if (artistId) {
      songData.artist = artistId;
    }

    const song = await payload.create({
      collection: 'songs',
      data: songData,
    });

    logger.debug(`Created song: ${title}${artistId ? ` (artist: ${artistId})` : ''}`);
    return song.id;
  } catch (error) {
    logger.error(`Failed to create song "${title}": ${error}`);
    return null;
  }
}

/**
 * Convert plain text to Lexical JSON format
 */
function convertTextToLexical(text: string | null | undefined): object {
  if (!text || text.trim() === '') {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    };
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              format: 0,
              mode: 'normal',
              style: '',
              text: text.trim(),
              version: 1,
            },
          ],
          direction: 'ltr',
        },
      ],
      direction: 'ltr',
    },
  };
}

/**
 * Try to find a DJ by parsing the note field for DJ names
 * Returns DJ ID if found, null otherwise
 */
async function findDJFromNote(
  payload: Payload,
  note: string | null | undefined,
): Promise<string[]> {
  if (!note) {
    return [];
  }

  const djIds: string[] = [];

  // Common patterns: "with [DJ Name]", "hosted by [DJ Name]", etc.
  const djPatterns = [
    /with\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g, // "with Josh T. Landow"
    /hosted\s+by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)/g, // "hosted by Josh Landow"
  ];

  for (const pattern of djPatterns) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(note)) !== null) {
      const djName = match[1].trim();

      // Search for DJ by person name
      const djs = await payload.find({
        collection: 'djs',
        where: {
          displayName: {
            contains: djName,
          },
        },
        limit: 1,
      });

      if (djs.docs.length > 0) {
        djIds.push(djs.docs[0].id);
        logger.debug(`Found DJ from note: ${djName} (ID: ${djs.docs[0].id})`);
      }
    }
  }

  return djIds;
}

/**
 * Import a single on-demand item
 */
async function importOnDemandItem(payload: Payload, item: OnDemand): Promise<boolean> {
  try {
    // Check if already imported
    if (await onDemandExists(payload, item.id)) {
      logger.debug(`OnDemand ${item.id} already exists, skipping`);
      return false;
    }

    // Import on-demand image if available
    let imageId: string | undefined;
    if (item.image && item.image.trim() !== '') {
      logger.debug(`Importing image for on-demand ${item.id}: ${item.image}`);
      const imageResult = await importImageFromUrl(payload, item.image, {
        alt: item.headline || 'On-demand show image',
        caption: item.headline,
        legacyUrl: item.image,
        legacyId: item.id,
      });

      if (imageResult.success && imageResult.mediaId) {
        imageId = imageResult.mediaId;
        logger.debug(`Image imported: ${imageResult.cloudinaryUrl}`);
      } else {
        logger.warn(`Failed to import image for on-demand ${item.id}: ${imageResult.error}`);
      }
    }

    // Parse artists from headline
    const artistResult = processArtistString(item.headline || '');
    const artistIds = await Promise.all(
      artistResult.artistNames.map((name) => findOrCreateArtist(payload, name)),
    );
    const validArtistIds = artistIds.filter((id): id is string => id !== null);

    // Parse and create songs (use first artist ID for song artist relationship)
    const primaryArtistId = validArtistIds.length > 0 ? validArtistIds[0] : null;
    const songTitles = parseSongTitles(item.songs);
    const songIds = await Promise.all(
      songTitles.map((title) => findOrCreateSong(payload, title, primaryArtistId)),
    );
    const validSongIds = songIds.filter((id): id is string => id !== null);

    // Find DJs from note
    const djIds = await findDJFromNote(payload, item.note);

    // Convert note to Lexical JSON
    const lexicalNote = convertTextToLexical(item.note);

    // Create on-demand record with all relationships
    await payload.create({
      collection: 'ondemand',
      data: {
        headline: item.headline || undefined,
        note: lexicalNote,
        songs: validSongIds.length > 0 ? validSongIds : undefined,
        djs: djIds.length > 0 ? djIds : undefined,
        artists: validArtistIds.length > 0 ? validArtistIds : undefined,
        audioUrl: item.audio_url || undefined,
        source: item.source || 'opendrive',
        image: imageId,
        date: item.date,
        legacyId: item.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported on-demand ${item.id}: ${item.headline} (${validArtistIds.length} artists, ${validSongIds.length} songs, ${djIds.length} DJs)`);
    return true;
  } catch (error) {
    logger.error(`Failed to import on-demand ${item.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importOnDemand(options: ImportOptions): Promise<void> {
  logger.info('Starting on-demand import...');
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

    // Fetch on-demand items from MySQL
    logger.info('Fetching on-demand items from MySQL...');
    const items = await getActiveOnDemand(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = items.length;
    logger.info(`Found ${stats.total} on-demand items to import`);

    // Import each item
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];

      const imported = await importOnDemandItem(payload, item);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === items.length - 1) {
        logProgress(i + 1, items.length, `OnDemand ${item.id}`);
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
  logger.info('On-demand import completed');
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
  importOnDemand(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importOnDemand, parseArgs, importOnDemandItem };
