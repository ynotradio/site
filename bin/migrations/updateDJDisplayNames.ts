#!/usr/bin/env tsx
/**
 * Update displayName field for all existing DJ records
 *
 * This script populates the displayName field for all DJs by fetching
 * their associated person names.
 *
 * Usage:
 *   tsx bin/migrations/updateDJDisplayNames.ts --env dev
 */

import type { Payload } from 'payload';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('UpdateDJDisplayNames');

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface ImportOptions {
  env: DatabaseEnv;
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
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/updateDJDisplayNames.ts [options]

Options:
  --env ENV        Environment to update: 'dev' (default) or 'prod'
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/updateDJDisplayNames.ts --env dev
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Update displayName for a single DJ record
 */
async function updateDJDisplayName(payload: Payload, dj: any): Promise<boolean> {
  try {
    // If DJ already has a displayName, skip
    if (dj.displayName && dj.displayName !== `DJ #${dj.id}`) {
      logger.debug(`DJ ${dj.id} already has displayName: ${dj.displayName}, skipping`);
      return false;
    }

    let displayName = `DJ #${dj.id}`;

    // Get person names if person relationship exists
    if (dj.person && Array.isArray(dj.person) && dj.person.length > 0) {
      const personIds = dj.person.map((p: any) => (typeof p === 'object' ? p.id : p));

      try {
        const people = await payload.find({
          collection: 'people',
          where: {
            id: {
              in: personIds,
            },
          },
          limit: personIds.length,
        });

        if (people.docs.length > 0) {
          displayName = people.docs.map((p: any) => p.name).join(', ');
        }
      } catch (error) {
        logger.error(`Failed to fetch person names for DJ ${dj.id}`, error as Error);
      }
    }

    // Update the DJ record
    await payload.update({
      collection: 'djs',
      id: dj.id,
      data: {
        displayName,
      },
    });

    logger.debug(`Updated DJ ${dj.id}: displayName="${displayName}"`);
    return true;
  } catch (error) {
    logger.error(`Failed to update DJ ${dj.id}`, error as Error);
    return false;
  }
}

/**
 * Main update function
 */
async function updateAllDJDisplayNames(options: ImportOptions): Promise<void> {
  logger.info('Starting DJ displayName update...');
  logger.info(`Environment: ${options.env}`);

  const stats: ImportStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Connect to Payload
    const payload = await getPayloadClient(options.env);

    // Fetch all DJs
    logger.info('Fetching DJ records...');
    const djs = await payload.find({
      collection: 'djs',
      limit: 1000, // Adjust if you have more DJs
      depth: 0, // Don't populate relationships in the find query
    });

    stats.total = djs.docs.length;
    logger.info(`Found ${stats.total} DJ records to update`);

    // Update each DJ
    for (let i = 0; i < djs.docs.length; i += 1) {
      const dj = djs.docs[i];

      const updated = await updateDJDisplayName(payload, dj);

      if (updated) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === djs.docs.length - 1) {
        logProgress(i + 1, djs.docs.length, `DJ ${dj.id}`);
      }
    }
  } catch (error) {
    logger.error('Update failed', error as Error);
    throw error;
  }

  // Log summary
  logSummary(stats);
  logger.info('DJ displayName update completed');
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

// Run the update when executed directly
if (isMainModule()) {
  const options = parseArgs();
  updateAllDJDisplayNames(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { updateAllDJDisplayNames, parseArgs };
