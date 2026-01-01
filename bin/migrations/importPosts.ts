#!/usr/bin/env tsx
/**
 * Import posts (stories and custom text) from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importPosts.ts --env dev --start-id 100
 *
 * Options:
 *   --env       Environment to import to: 'dev' (default) or 'prod'
 *   --start-id  Optional ID to start import from (for incremental imports)
 */

import type { Payload } from 'payload';
import { connectToDatabase, getActivePosts, type Post } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import type { DatabaseEnv } from './shared/payloadClient';

const logger = createLogger('PostsImport');

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
Usage: tsx bin/migrations/importPosts.ts [options]

Options:
  --env ENV        Environment to import to: 'dev' (default) or 'prod'
  --start-id ID    Optional ID to start import from (for incremental imports)
  --help, -h       Show this help message

Examples:
  tsx bin/migrations/importPosts.ts --env dev
  tsx bin/migrations/importPosts.ts --env prod --start-id 100
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Check if a post with the given legacy ID already exists
 */
async function postExists(payload: Payload, legacyId: number): Promise<boolean> {
  const existing = await payload.find({
    collection: 'posts',
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
 * Import a single post record
 */
async function importPost(payload: Payload, post: Post): Promise<boolean> {
  try {
    // Check if already imported
    if (await postExists(payload, post.id)) {
      logger.debug(`Post ${post.id} already exists, skipping`);
      return false;
    }

    // Convert HTML content to Lexical format
    const content = convertHtmlToLexical(post.content);

    // Create post record
    await payload.create({
      collection: 'posts',
      data: {
        headline: post.headline,
        startDate: post.start_date,
        endDate: post.end_date,
        content,
        imageUrl: post.image_url || undefined,
        priority: post.priority || 0,
        legacyId: post.id,
        migratedAt: new Date().toISOString(),
      },
    });

    logger.debug(`Imported post ${post.id}: ${post.headline}`);
    return true;
  } catch (error) {
    logger.error(`Failed to import post ${post.id}`, error as Error);
    return false;
  }
}

/**
 * Main import function
 */
async function importPosts(options: ImportOptions): Promise<void> {
  logger.info('Starting posts import...');
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

    // Fetch posts from MySQL
    logger.info('Fetching posts from MySQL...');
    const posts = await getActivePosts(mysqlConnection, {
      startId: options.startId,
    });

    stats.total = posts.length;
    logger.info(`Found ${stats.total} posts to import`);

    // Import each post
    for (let i = 0; i < posts.length; i += 1) {
      const post = posts[i];

      const imported = await importPost(payload, post);

      if (imported) {
        stats.success += 1;
      } else {
        stats.skipped += 1;
      }

      // Log progress every 10 records
      if ((i + 1) % 10 === 0 || i === posts.length - 1) {
        logProgress(i + 1, posts.length, `Post ${post.id}`);
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
  logger.info('Posts import completed');
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
  importPosts(options).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { importPosts, parseArgs, importPost };
