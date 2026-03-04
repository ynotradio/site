#!/usr/bin/env tsx
/**
 * Import CD of the Week entries from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importCdOfTheWeek.ts --to prod-neon --start-id 100
 *
 * Options:
 *   --to        Target database: 'prod-neon' (default) or 'local-postgres'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveCdOfTheWeek, type CdOfTheWeek } from './database';
import { getPayloadClient, findOrCreateArtist, findOrCreatePerson } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import { importImageFromUrl } from './shared/mediaImporter';
import { getReleaseMbid, getAlbumCoverArt } from './shared/musicbrainz';
import type { PostgresTarget } from './shared/payloadClient';

const logger = createLogger('CdOfTheWeekImport');

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
Usage: tsx bin/migrations/importCdOfTheWeek.ts [options]

Options:
  --to TARGET      Target database: 'prod-neon' (default) or 'local-postgres'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importCdOfTheWeek.ts --to prod-neon
  tsx bin/migrations/importCdOfTheWeek.ts --to local-postgres --start-id 100
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
    // Skip entries with empty titles (placeholder entries that were never completed)
    if (!item.title || item.title.trim() === '') {
      logger.debug(`CD of the Week ${item.id} has no title, skipping`);
      return false;
    }

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

    // If legacy image failed OR no legacy image exists, try Cover Art Archive with MusicBrainz
    if (!coverImageId) {
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
        } else {
          logger.debug(`No cover art found in MusicBrainz for ${item.title}`);
        }
      } catch (error) {
        logger.debug(`MusicBrainz cover art fetch failed for ${item.title}`);
      }
    }

    // Find or create record (album)
    // First try to find by title only (handles artist ID mismatches)
    let recordId: string | number | undefined;
    const existingByTitle = await payload.find({
      collection: 'records',
      where: {
        title: {
          equals: item.title,
        },
      },
      limit: 1,
    });

    if (existingByTitle.docs.length > 0) {
      recordId = existingByTitle.docs[0].id;
      logger.debug(`Found existing record by title: "${item.title}" (id: ${recordId})`);
    } else {
      // No existing record, create new one
      try {
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
        logger.debug(`Created new record: "${item.title}" (id: ${recordId})`);
      } catch (recordError: any) {
        // Record creation failed, try to find by title again (race condition)
        logger.debug(`Record creation failed for "${item.title}", retrying find`);
        const retryFind = await payload.find({
          collection: 'records',
          where: { title: { equals: item.title } },
          limit: 1,
        });
        if (retryFind.docs.length > 0) {
          recordId = retryFind.docs[0].id;
          logger.debug(`Found record after retry: "${item.title}" (id: ${recordId})`);
        } else {
          throw recordError;
        }
      }
    }

    if (!recordId) {
      throw new Error(`Failed to find or create record for "${item.title}"`);
    }

    // Convert HTML review to Lexical format
    // review is required by Payload, so we need valid content
    let review;
    try {
      if (item.review && item.review.trim() !== '') {
        review = convertHtmlToLexical(item.review);
        logger.debug(`Converted review for CD ${item.id} (length: ${item.review.length})`);
      } else {
        // Provide default review content if missing
        review = convertHtmlToLexical('<p>No review provided.</p>');
        logger.debug(`Using default review for CD ${item.id} (original was empty)`);
      }
    } catch (error) {
      logger.error(
        `Failed to convert review for CD ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      logger.debug(`Review content preview: ${item.review?.substring(0, 200) || 'null'}`);
      review = convertHtmlToLexical('<p>No review provided.</p>');
    }

    // Validate that review structure is correct
    if (!review || !review.root || !review.root.children || review.root.children.length === 0) {
      logger.warn(`Invalid review structure for CD ${item.id}, regenerating`);
      review = convertHtmlToLexical('<p>Review content unavailable.</p>');
    }

    // Additional validation: ensure children have proper structure
    if (review.root.children.length > 0) {
      const firstChild = review.root.children[0];
      if (!firstChild.type || !firstChild.children || firstChild.children.length === 0) {
        logger.warn(`Invalid paragraph structure for CD ${item.id}, regenerating`);
        review = convertHtmlToLexical('<p>Review content unavailable.</p>');
      }
    }

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
    try {
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
    } catch (createError: any) {
      // Log detailed error information
      logger.error(`Failed to create CD of the Week ${item.id}`);
      logger.error(`Error: ${createError.message}`);
      if (createError.data?.errors) {
        logger.error(`Validation errors: ${JSON.stringify(createError.data.errors, null, 2)}`);
      }
      logger.debug(`Review structure: ${JSON.stringify(review, null, 2)}`);
      throw createError;
    }
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
