#!/usr/bin/env tsx
/**
 * Import ads (sponsors) from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importAds.ts --to production-db --start-id 100
 *
 * Options:
 *   --to        Target database: 'production-db' (default), 'preview-db', or 'local-postgres'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveAds, type Ad } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import { stripHtmlTags } from './shared/importUtils';
import type { PostgresTarget } from './shared/payloadClient';

const logger = createLogger('AdsImport');

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
    to: 'production-db',
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--to') {
      const toValue = args[i + 1];
      if (toValue === 'prod-neon' || toValue === 'production-db') {
        options.to = 'production-db';
      } else if (toValue === 'dev-neon' || toValue === 'preview-db') {
        options.to = 'preview-db';
      } else if (toValue === 'local-postgres') {
        options.to = toValue;
      } else {
        throw new Error('--to must be "production-db", "preview-db", or "local-postgres"');
      }
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
Usage: tsx bin/migrations/importAds.ts [options]

Options:
  --to TARGET      Target database: 'production-db' (default), 'preview-db', or 'local-postgres'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importAds.ts --to production-db
  tsx bin/migrations/importAds.ts --to local-postgres --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if an ad with the given legacy ID already exists
 */
async function adExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'ads',
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
 * Import a single ad record
 */
async function importAd(payload: Payload, ad: Ad): Promise<boolean> {
  try {
    // Check if already imported
    if (await adExists(payload, ad.id)) {
      logger.debug(`Ad ${ad.id} already exists, skipping`);
      return false;
    }

    // Strip HTML tags from name field
    const cleanName = stripHtmlTags(ad.name);

    // Import ad image if available
    let imageId: string | undefined;
    if (ad.image_url && ad.image_url.trim() !== '') {
      logger.debug(`Importing image for ad ${ad.id}: ${ad.image_url}`);
      const imageResult = await importImageFromUrl(payload, ad.image_url, {
        alt: `Advertisement for ${cleanName}`,
        caption: cleanName,
        legacyUrl: ad.image_url,
        legacyId: ad.id,
      });

      if (imageResult.success && imageResult.mediaId) {
        imageId = imageResult.mediaId;
        logger.debug(`Image imported: ${imageResult.cloudinaryUrl}`);
      } else {
        logger.warn(`Failed to import image for ad ${ad.id}: ${imageResult.error}`);
      }
    }

    // Create ad record
    await payload.create({
      collection: 'ads',
      data: {
        name: cleanName,
        startDate: ad.start_date,
        endDate: ad.end_date,
        image: imageId,
        imageUrl: ad.image_url, // Store original URL for reference
        webUrl: ad.web_url || undefined,
        priority: ad.priority || 0,
        legacyId: ad.id,
        migratedAt: new Date().toISOString(),
        _status: 'published' as const,
      },
    });

    logger.debug(`Imported ad ${ad.id}: ${cleanName}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import ad ${ad.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importAds(options: ImportOptions): Promise<void> {
  logger.info('Starting ads import...');
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

    // Fetch ads from MySQL
    logger.info('Fetching ads from MySQL...');
    const ads = await getActiveAds(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = ads.length;
    logger.info(`Found ${stats.total} ads to import`);

    // Import each ad
    for (let i = 0; i < ads.length; i += 1) {
      const ad = ads[i];

      const imported = await importAd(payload, ad);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === ads.length - 1) {
        logProgress(i + 1, ads.length, `Ad ${ad.id}`);
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
  logger.info('Ads import completed');
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
  importAds(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { importAds, parseArgs, importAd };
