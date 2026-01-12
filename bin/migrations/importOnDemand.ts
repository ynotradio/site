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
import {
  getPayloadClient,
  findDJByDisplayName,
  findOrCreateArtist,
  parseOnDemandHeadline,
} from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import { convertHtmlToLexical } from './shared/importUtils';
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

    // Parse headline to extract DJ and artist names
    const parsed = parseOnDemandHeadline(item.headline || '');

    // Find matching DJs by display name
    const djIds: number[] = [];
    for (const djName of parsed.djNames) {
      const djId = await findDJByDisplayName(payload, djName);
      if (djId) {
        djIds.push(djId);
        logger.debug(`Found DJ: ${djName} (id: ${djId})`);
      }
    }

    // Find or create artists
    const artistIds: number[] = [];
    for (const artistName of parsed.artistNames) {
      try {
        const artistId = await findOrCreateArtist(payload, artistName);
        artistIds.push(artistId);
        logger.debug(`Found/created artist: ${artistName} (id: ${artistId})`);
      } catch (error) {
        logger.warn(`Failed to find/create artist: ${artistName}`);
      }
    }

    // If no DJs or artists found from parsing, try treating the headline as an artist name
    if (djIds.length === 0 && artistIds.length === 0 && item.headline) {
      try {
        const artistId = await findOrCreateArtist(payload, item.headline);
        artistIds.push(artistId);
        logger.debug(`Created artist from headline: ${item.headline} (id: ${artistId})`);
      } catch (error) {
        logger.debug(`Could not create artist from headline: ${item.headline}`);
      }
    }

    // Note: We're not populating the songs relationship for now
    // The songs field in MySQL contains free-form text that doesn't map to Song records
    // Songs would need to be created/matched separately

    // Convert note text to Lexical richText format
    // Provide default if empty since description might be required in UI
    const description = item.note && item.note.trim()
      ? convertHtmlToLexical(item.note)
      : convertHtmlToLexical('<p>No description available.</p>');

    // Create on-demand record with relationships
    await payload.create({
      collection: 'ondemand',
      data: {
        headline: item.headline || undefined,
        description,
        djs: djIds.length > 0 ? djIds : undefined,
        artists: artistIds.length > 0 ? artistIds : undefined,
        // songs: not populated - would require parsing and creating Song records
        audioUrl: item.audio_url || undefined,
        image: imageId,
        date: item.date,
        legacyId: item.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported on-demand ${item.id}: ${item.headline}`);
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
  importOnDemand(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { importOnDemand, parseArgs, importOnDemandItem };
