#!/usr/bin/env tsx
/**
 * Import CD of the Week entries from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importCdOfTheWeek.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveCdOfTheWeek, type CdOfTheWeek } from './database';
import { getPayloadClient, findOrCreateArtist, findOrCreatePerson } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import { importImageFromUrl } from './shared/mediaImporter';
import { getReleaseMbid, getAlbumCoverArt } from './shared/musicbrainz';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('CdOfTheWeekImport');

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
Usage: tsx bin/migrations/importCdOfTheWeek.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importCdOfTheWeek.ts --env dev
  tsx bin/migrations/importCdOfTheWeek.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a CD of the Week entry with the given legacy ID already exists
 */
async function cdOfTheWeekExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'cdoftheweek',
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
 * Import a single CD of the Week entry
 */
/**
 * Import a single CD of the Week record, dynamically creating artist and record
 */
async function importCdOfTheWeekItem(payload: Payload, item: CdOfTheWeek): Promise<boolean> {
  try {
    // Check if already imported
    if (await cdOfTheWeekExists(payload, item.id)) {
      logger.debug(`CD of the Week ${item.id} already exists, skipping`);
      return false;
    }

    // Find or create artist
    const artistId = await findOrCreateArtist(payload, item.artist);

    // Query MusicBrainz for release MBID
    let releaseMbid: string | null = null;
    try {
      logger.debug(`Querying MusicBrainz for: ${item.title} by ${item.artist}`);
      releaseMbid = await getReleaseMbid(item.title, item.artist);
      if (releaseMbid) {
        logger.debug(`Found MusicBrainz release ID: ${releaseMbid}`);
      }
    } catch (error) {
      logger.debug(`MusicBrainz query failed for ${item.title}`);
    }

    // Import cover image if available
    let coverImageId: string | undefined;

    // Try legacy URL first
    if (item.cd_pic_url && item.cd_pic_url.trim() !== '') {
      logger.debug(`Importing cover image for CD ${item.id}: ${item.cd_pic_url}`);
      const imageResult = await importImageFromUrl(payload, item.cd_pic_url, {
        alt: `Album cover for ${item.title} by ${item.artist}`,
        caption: `${item.title} - ${item.artist}`,
        legacyUrl: item.cd_pic_url,
        legacyId: item.id,
      });

      if (imageResult.success && imageResult.mediaId) {
        coverImageId = imageResult.mediaId;
        logger.debug(`Cover image imported: ${imageResult.cloudinaryUrl}`);
      } else {
        logger.warn(`Failed to import legacy cover image for CD ${item.id}: ${imageResult.error}`);
      }
    }

    // If legacy image failed and we have MusicBrainz release ID, try Cover Art Archive
    if (!coverImageId && releaseMbid) {
      try {
        logger.debug(`Attempting to fetch cover art from MusicBrainz for ${item.title}`);
        const coverArtUrl = await getAlbumCoverArt(item.title, item.artist);

        if (coverArtUrl) {
          logger.debug(`Found MusicBrainz cover art: ${coverArtUrl}`);
          const imageResult = await importImageFromUrl(payload, coverArtUrl, {
            alt: `Album cover for ${item.title} by ${item.artist}`,
            caption: `${item.title} - ${item.artist} (from MusicBrainz)`,
            legacyUrl: coverArtUrl,
            legacyId: item.id,
          });

          if (imageResult.success && imageResult.mediaId) {
            coverImageId = imageResult.mediaId;
            logger.info(`✓ Cover art imported from MusicBrainz: ${imageResult.cloudinaryUrl}`);
          }
        }
      } catch (error) {
        logger.debug(`MusicBrainz cover art fetch failed for ${item.title}`);
      }
    }

    // Find or create record (album)
    let recordId: string | number;
    const existingRecord = await payload.find({
      collection: 'records',
      where: {
        and: [
          {
            title: {
              equals: item.title,
            },
          },
          {
            artist: {
              equals: artistId,
            },
          },
        ],
      },
      limit: 1,
    });

    if (existingRecord.docs.length > 0) {
      recordId = existingRecord.docs[0].id;
    } else {
      // Create new record
      const newRecord = await payload.create({
        collection: 'records',
        data: {
          title: item.title,
          artist: artistId as any,
          label: item.label || undefined,
          coverImage: coverImageId,
          musicbrainzId: releaseMbid || undefined,
          legacyId: item.id,
          migratedAt: new Date().toISOString(),
        },
      });
      recordId = newRecord.id;
    }

    // Convert HTML review to Lexical format
    // review is required, so we need valid content
    const review = item.review && item.review.trim()
      ? convertHtmlToLexical(item.review)
      : convertHtmlToLexical('<p>No review provided.</p>');

    // Find or create the reviewer as a Person
    let reviewerId: number | undefined;
    if (item.reviewer && item.reviewer.trim()) {
      try {
        reviewerId = await findOrCreatePerson(payload, item.reviewer);
        logger.debug(`Found/created reviewer: ${item.reviewer} (id: ${reviewerId})`);
      } catch (error) {
        logger.warn(`Failed to find/create reviewer: ${item.reviewer}`);
      }
    }

    // Create CD of the Week record
    await payload.create({
      collection: 'cdoftheweek',
      data: {
        record: recordId as any,
        review,
        reviewer: reviewerId,
        date: item.date,
        legacyId: item.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported CD of the Week ${item.id} for ${item.artist} - ${item.title}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import CD of the Week ${item.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importCdOfTheWeek(options: ImportOptions): Promise<void> {
  logger.info('Starting CD of the Week import...');
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

    // Fetch CD of the Week entries from MySQL
    logger.info('Fetching CD of the Week entries from MySQL...');
    const items = await getActiveCdOfTheWeek(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = items.length;
    logger.info(`Found ${stats.total} CD of the Week entries to import`);

    // Import each item
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];

      const imported = await importCdOfTheWeekItem(payload, item);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === items.length - 1) {
        logProgress(i + 1, items.length, `CD of the Week ${item.id}`);
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
  logger.info('CD of the Week import completed');
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
  importCdOfTheWeek(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { importCdOfTheWeek, parseArgs, importCdOfTheWeekItem };
