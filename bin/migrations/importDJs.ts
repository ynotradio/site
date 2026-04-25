#!/usr/bin/env tsx
/**
 * Import DJs from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importDJs.ts --to prod-neon --start-id 100
 *
 * Options:
 *   --to        Target database: 'prod-neon' (default) or 'local-postgres'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActiveDeejays, type Deejay } from './database';
import { getPayloadClient, findOrCreatePerson } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import { stripHtmlTags } from './shared/importUtils';
import type { PostgresTarget } from './shared/payloadClient';

const logger = createLogger('DJsImport');

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
Usage: tsx bin/migrations/importDJs.ts [options]

Options:
  --to TARGET      Target database: 'prod-neon' (default) or 'local-postgres'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importDJs.ts --to prod-neon
  tsx bin/migrations/importDJs.ts --to local-postgres --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a DJ with the given legacy ID already exists
 */
async function djExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'djs',
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
 * Parse DJ names that may contain multiple people
 * E.g., "M.J. & Patria" -> ["M.J.", "Patria"]
 */
function parseDJNames(name: string): string[] {
  // Split on " & " or " and " (case insensitive)
  const separators = [' & ', ' and ', ' And ', ' AND '];

  for (const separator of separators) {
    if (name.includes(separator)) {
      return name.split(separator).map((n) => n.trim()).filter(Boolean);
    }
  }

  // Single person
  return [name];
}

/**
 * Import a single DJ record
 */
async function importDJ(payload: Payload, dj: Deejay): Promise<boolean> {
  try {
    // Check if already imported
    if (await djExists(payload, dj.id)) {
      logger.debug(`DJ ${dj.id} already exists, skipping`);
      return false;
    }

    // Strip HTML tags from name and show fields
    const cleanName = stripHtmlTags(dj.name);
    const cleanShow = stripHtmlTags(dj.show);
    const cleanExternalConnectText = stripHtmlTags(dj.external_connect_text);

    // Parse DJ name(s) - may contain multiple people (e.g., "M.J. & Patria")
    const names = parseDJNames(cleanName);
    logger.debug(`DJ ${dj.id}: Found ${names.length} person(s): ${names.join(', ')}`);

    // Find or create person record(s) for this DJ
    const personIds = await Promise.all(
      names.map((name) => findOrCreatePerson(payload, name)),
    );

    // Import DJ photo if available
    let photoId: string | undefined;
    if (dj.pic && dj.pic.trim() !== '') {
      logger.debug(`Importing photo for DJ ${dj.id}: ${dj.pic}`);
      const photoResult = await importImageFromUrl(payload, dj.pic, {
        alt: `Photo of ${cleanName}`,
        caption: `${cleanShow} DJ photo`,
        legacyUrl: dj.pic,
        legacyId: dj.id,
      });

      if (photoResult.success && photoResult.mediaId) {
        photoId = photoResult.mediaId;
        logger.debug(`Photo imported: ${photoResult.cloudinaryUrl}`);
      } else {
        logger.warn(`Failed to import photo for DJ ${dj.id}: ${photoResult.error}`);
      }
    }

    // Create DJ record
    await payload.create({
      collection: 'djs',
      data: {
        person: personIds as any,
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: cleanShow,
                  },
                ],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        email: dj.email || undefined,
        externalConnectText: cleanExternalConnectText || undefined,
        externalConnectUrl: dj.external_connect_url || undefined,
        photo: photoId,
        onAir: dj.deleted === 'No',
        sortOrder: dj.sort,
        legacyId: dj.id,
        migratedAt: new Date().toISOString(),
        _status: 'published' as const,
      },
    });

    logger.debug(`Imported DJ ${dj.id}: ${cleanName} (${cleanShow}) - ${personIds.length} person(s)`);
    return true;
  } catch (error) {
    logger.error(`Failed to import DJ ${dj.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importDJs(options: ImportOptions): Promise<void> {
  logger.info('Starting DJs import...');
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

    // Fetch DJs from MySQL
    logger.info('Fetching DJs from MySQL...');
    const djs = await getActiveDeejays(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = djs.length;
    logger.info(`Found ${stats.total} DJs to import`);

    // Import each DJ
    for (let i = 0; i < djs.length; i += 1) {
      const dj = djs[i];

      const imported = await importDJ(payload, dj);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === djs.length - 1) {
        logProgress(i + 1, djs.length, `DJ ${dj.id}`);
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
  logger.info('DJs import completed');
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
  importDJs(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export {
  importDJs, parseArgs, importDJ, parseDJNames,
};
