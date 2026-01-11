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
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { importImageFromUrl } from './shared/mediaImporter';
import { slugify, cleanHeadline } from './shared/slugify';
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
 * Returns: 'success' | 'skipped' | 'error'
 */
async function importPost(payload: Payload, post: Post): Promise<'success' | 'skipped' | 'error'> {
  let content; // Declare at function scope so it's accessible in catch block

  try {
    // Check if already imported
    if (await postExists(payload, post.id)) {
      logger.debug(`Post ${post.id} already exists, skipping`);
      return 'skipped';
    }

    // Convert HTML content to Lexical format
    // Use enhanced converter for custom texts (complex HTML), simple converter for stories
    content = post.source === 'custom_text'
      ? convertHtmlToLexicalEnhanced(post.content)
      : convertHtmlToLexical(post.content);

    // Ensure content has valid structure - provide fallback for empty/invalid content
    if (!content?.root?.children || content.root.children.length === 0
        || (content.root.children.length === 1
         && content.root.children[0].children?.length === 1
         && content.root.children[0].children[0].text === '')) {
      // Content is empty or invalid - provide minimal valid structure
      content = {
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
                  text: '(No content available)',
                  format: 0,
                  mode: 'normal',
                  style: '',
                  detail: 0,
                  version: 1,
                },
              ],
              direction: 'ltr',
            },
          ],
          direction: 'ltr',
        },
      };
      logger.debug(`Post ${post.id} had empty content, using fallback`);
    }

    // Import post image if available
    let imageId: string | undefined;
    if (post.image_url && post.image_url.trim() !== '') {
      logger.debug(`Importing image for post ${post.id}: ${post.image_url}`);
      const imageResult = await importImageFromUrl(payload, post.image_url, {
        alt: `Image for post: ${post.headline}`,
        caption: post.headline,
        legacyUrl: post.image_url,
        legacyId: post.id,
      });

      if (imageResult.success && imageResult.mediaId) {
        imageId = imageResult.mediaId;
        logger.debug(`Image imported: ${imageResult.cloudinaryUrl}`);
      } else {
        logger.warn(`Failed to import image for post ${post.id}: ${imageResult.error}`);
      }
    }

    // Clean headline and generate slug
    const cleanedHeadline = cleanHeadline(post.headline);

    // Generate slug based on source type
    let slug: string;
    if (post.permalink) {
      // For custom texts with existing permalinks, keep them unchanged
      slug = post.permalink;
    } else if (post.source === 'story') {
      // For stories, generate slug with date prefix: YYYY-MM-DD--headline
      const date = new Date(post.start_date);
      const datePrefix = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const headlineSlug = slugify(post.headline);
      slug = `${datePrefix}--${headlineSlug}`;
    } else {
      // Fallback for other cases
      slug = slugify(post.headline);
    }

    // Create post record
    await payload.create({
      collection: 'posts',
      data: {
        headline: cleanedHeadline,
        slug,
        startDate: post.start_date,
        endDate: post.end_date,
        content,
        image: imageId,
        imageUrl: post.image_url, // Store original URL as fallback
        priority: post.priority || 0,
        legacyId: post.id,
        migratedAt: new Date().toISOString(),
        _status: 'published', // Set status to published so posts are immediately visible
      },
    });

    logger.debug(`Imported post ${post.id} [${post.source}]: ${cleanedHeadline} (slug: ${slug})`);
    return 'success';
  } catch (error) {
    // Log content JSON when validation fails
    if (error instanceof Error && error.message.includes('Content')) {
      logger.error(`Content validation failed for post ${post.id} [${post.source}]`);
      logger.error('Generated Lexical content:', JSON.stringify(content, null, 2));
    }
    logger.error(`Failed to import post ${post.id}`, error as Error);
    return 'error';
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

      const result = await importPost(payload, post);

      if (result === 'success') {
        stats.success += 1;
      } else if (result === 'skipped') {
        stats.skipped += 1;
      } else {
        stats.errors += 1;
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
  importPosts(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { importPosts, parseArgs, importPost };
