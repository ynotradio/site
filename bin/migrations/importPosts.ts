#!/usr/bin/env tsx
/**
 * Import posts (stories and custom text) from MySQL to Payload CMS PostgreSQL database
 *
 * Usage:
 *   tsx bin/migrations/importPosts.ts --to prod-neon --start-id 100
 *   tsx bin/migrations/importPosts.ts --to prod-neon --sync-active
 *
 * Options:
 *   --to            Target database: 'prod-neon' (default) or 'local-postgres'
 *   --start-id      Optional ID to start import from (for incremental imports)
 *   --sync-active   Refresh currently-visible stories: compares MySQL active stories
 *                   with PG and re-imports any that have changed (headline, content,
 *                   priority, dates, or image). Only affects front-page stories.
 */

import type { Payload } from 'payload';
import * as crypto from 'crypto';
import { connectToDatabase, getActivePosts, type Post } from './database';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logProgress, logSummary } from './shared/logger';
import { convertHtmlToLexical } from './shared/importUtils';
import { convertHtmlToLexicalEnhanced } from './shared/enhancedHtmlToLexical';
import { importImageFromUrl } from './shared/mediaImporter';
import { cleanHeadline } from './shared/slugify';
import { slugifyHeadline, formatDatePrefix } from '../../payload/src/collections/hooks/slugUtils';
import type { PostgresTarget } from './shared/payloadClient';

const logger = createLogger('PostsImport');

interface ImportStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface ImportOptions {
  to: PostgresTarget;
  startId?: number;
  syncActive?: boolean;
  storiesStartId?: number;
  customTextsStartId?: number;
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
    } else if (arg === '--stories-start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--stories-start-id must be a positive number');
      }
      options.storiesStartId = startId;
      i += 1;
    } else if (arg === '--custom-texts-start-id') {
      const startId = parseInt(args[i + 1], 10);
      if (Number.isNaN(startId) || startId < 0) {
        throw new Error('--custom-texts-start-id must be a positive number');
      }
      options.customTextsStartId = startId;
      i += 1;
    } else if (arg === '--sync-active') {
      options.syncActive = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: tsx bin/migrations/importPosts.ts [options]

Options:
  --to TARGET                 Target database: 'prod-neon' (default) or 'local-postgres'
  --start-id ID               Optional ID to start stories + custom texts from
  --stories-start-id ID       Optional story ID to start import from
  --custom-texts-start-id ID  Optional custom_texts ID to start import from
  --sync-active               Refresh currently-visible stories that have changed in MySQL
  --help, -h                  Show this help message

Examples:
  tsx bin/migrations/importPosts.ts --to prod-neon
  tsx bin/migrations/importPosts.ts --to local-postgres --start-id 100
  tsx bin/migrations/importPosts.ts --stories-start-id 700 --custom-texts-start-id 220
  tsx bin/migrations/importPosts.ts --to prod-neon --sync-active
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Compute a hash of story fields that matter for sync comparison.
 * If any of these fields change in MySQL, the PG record should be refreshed.
 */
function storyHash(
  headline: string,
  content: string,
  priority: number,
  startDate: string,
  endDate: string,
  imageUrl: string,
  linkUrl: string,
): string {
  const data = [headline, content, String(priority), startDate, endDate, imageUrl, linkUrl].join(
    '|',
  );
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Sync currently-visible stories: compare MySQL active stories with PG records
 * and re-import any that have changed. Returns count of refreshed records.
 */
async function syncActiveStories(
  mysqlConnection: any,
  payload: Payload,
): Promise<{ refreshed: number; unchanged: number; errors: number }> {
  const stats = { refreshed: 0, unchanged: 0, errors: 0 };

  // Fetch only currently-visible stories from MySQL
  const [activeStories] = await mysqlConnection.query(
    `SELECT id, headline, story, priority, start_date, end_date, pic, pic_url
     FROM stories
     WHERE deleted = 'n' AND start_date <= NOW() AND end_date >= NOW()
     ORDER BY id ASC`,
  );

  logger.info(`[sync-active] Found ${(activeStories as any[]).length} active stories in MySQL`);

  for (const story of activeStories as any[]) {
    const mysqlHash = storyHash(
      story.headline,
      '', // Content excluded: MySQL stores HTML, PG stores Lexical JSON
      story.priority,
      String(story.start_date),
      String(story.end_date),
      story.pic || '',
      story.pic_url || '',
    );

    // Find matching PG record
    const existing = await payload.find({
      collection: 'posts',
      where: { legacyId: { equals: story.id } },
      limit: 1,
    });

    if (existing.docs.length === 0) {
      // New active story — will be handled by normal import flow
      logger.info(`[sync-active] Story ${story.id} not in PG yet, will be imported normally`);
    } else {
      const pgPost = existing.docs[0] as any;
      // Compare key fields: headline, priority, dates, image, link
      const pgHash = storyHash(
        pgPost.headline || '',
        '',
        pgPost.priority || 0,
        String(pgPost.startDate || ''),
        String(pgPost.endDate || ''),
        pgPost.imageUrl || '',
        pgPost.linkUrl || '',
      );

      // Content hash comparison is imperfect (PG has Lexical, MySQL has HTML),
      // so also compare non-content fields directly
      const headlineChanged = cleanHeadline(story.headline) !== pgPost.headline;
      const priorityChanged = story.priority !== pgPost.priority;
      const linkChanged = (story.pic_url || '') !== (pgPost.linkUrl || '');

      if (!headlineChanged && !priorityChanged && !linkChanged && mysqlHash === pgHash) {
        stats.unchanged += 1;
      } else {
        // Record has changed — delete PG record and re-import
        const changedFields = [
          headlineChanged ? 'headline' : null,
          priorityChanged ? 'priority' : null,
          linkChanged ? 'linkUrl' : null,
        ]
          .filter(Boolean)
          .join(', ') || 'content/dates/image';

        logger.info(`[sync-active] Story ${story.id} changed (${changedFields}), refreshing...`);

        try {
          // Delete existing PG record
          await payload.delete({ collection: 'posts', id: pgPost.id });

          // Re-import from MySQL
          const post: Post = {
            id: story.id,
            headline: story.headline,
            start_date: story.start_date,
            end_date: story.end_date,
            content: story.story,
            image_url: story.pic,
            link_url: story.pic_url,
            priority: story.priority,
            deleted: story.deleted,
            source: 'story' as const,
          };

          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          const result = await importPost(payload, post);
          if (result === 'success') {
            stats.refreshed += 1;
            logger.info(
              `[sync-active] ✓ Story ${story.id} refreshed: "${cleanHeadline(story.headline)}"`,
            );
          } else {
            stats.errors += 1;
            logger.error(`[sync-active] ✗ Story ${story.id} failed to re-import`);
          }
        } catch (error) {
          stats.errors += 1;
          logger.error(`[sync-active] ✗ Story ${story.id} error`, error as Error);
        }
      }
    }
  }

  return stats;
}

/**
 * Sync front-page visibility: ensures only stories that are currently active
 * and non-deleted in MySQL have showOnFrontPage=true in Postgres.
 *
 * Catches: soft-deleted stories, hard-deleted stories (no longer in MySQL),
 * and custom texts that were incorrectly imported with showOnFrontPage=true.
 */
async function syncDeletedFromFrontPage(
  mysqlConnection: any,
  payload: Payload,
): Promise<{ fixed: number }> {
  const stats = { fixed: 0 };

  // Paginate through all Postgres posts that are on the front page with a legacyId
  const allFrontPagePosts: { pgId: string; legacyId: number }[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await payload.find({
      collection: 'posts',
      where: {
        showOnFrontPage: { equals: true },
        legacyId: { exists: true },
      },
      limit: 100,
      page,
    });

    for (const doc of result.docs as any[]) {
      if (doc.legacyId) {
        allFrontPagePosts.push({ pgId: doc.id, legacyId: doc.legacyId });
      }
    }

    if (!result.hasNextPage) break;
    page += 1;
  }

  if (allFrontPagePosts.length === 0) return stats;

  logger.info(
    `[sync-deleted] Checking ${allFrontPagePosts.length} front-page posts against MySQL`,
  );

  // Batch-query MySQL for which legacy IDs are active (non-deleted) stories
  const legacyIds = allFrontPagePosts.map((r) => r.legacyId);
  const [activeRows] = await mysqlConnection.query(
    "SELECT id FROM stories WHERE id IN (?) AND deleted = 'n'",
    [legacyIds],
  );

  const activeSet = new Set((activeRows as any[]).map((r: any) => r.id));

  // Any front-page post NOT in the active MySQL set should be removed
  const toFix = allFrontPagePosts.filter(({ legacyId }) => !activeSet.has(legacyId));

  if (toFix.length === 0) {
    logger.info('[sync-deleted] All front-page posts are active in MySQL');
    return stats;
  }

  logger.info(
    `[sync-deleted] ${toFix.length} posts to remove from front page (not active in MySQL)`,
  );

  for (const { pgId, legacyId } of toFix) {
    try {
      await payload.update({
        collection: 'posts',
        id: pgId,
        data: { showOnFrontPage: false },
      });
      stats.fixed += 1;
      logger.info(`[sync-deleted] ✓ Post legacyId=${legacyId} removed from front page`);
    } catch (error) {
      logger.error(`[sync-deleted] ✗ Post legacyId=${legacyId} update failed`, error as Error);
    }
  }

  return stats;
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
  let content;

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
    if (
      !content?.root?.children
      || content.root.children.length === 0
      || (content.root.children.length === 1
        && content.root.children[0].children?.length === 1
        && content.root.children[0].children[0].text === '')
    ) {
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
      const datePrefix = formatDatePrefix(new Date(post.start_date));
      const headlineSlug = slugifyHeadline(post.headline);
      slug = headlineSlug ? `${datePrefix}--${headlineSlug}` : `${datePrefix}--post-${post.id}`;
    } else {
      // Fallback for other cases — use legacy ID if headline can't be slugified
      slug = slugifyHeadline(post.headline) || `post-${post.id}`;
    }

    // Create post record — retry with legacyId-suffixed slug on unique constraint violation
    const postData = {
      headline: cleanedHeadline,
      slug,
      startDate: post.start_date,
      endDate: post.end_date,
      content,
      image: imageId,
      imageUrl: post.image_url, // Store original image URL as fallback
      linkUrl: post.link_url, // Store link URL for story image click target
      priority: post.priority || 0,
      showOnFrontPage: post.source === 'story'
        && post.deleted?.toLowerCase() !== 'y', // Deleted stories stay published but off front page
      legacyId: post.id,
      migratedAt: new Date().toISOString(),
      _status: 'published' as const, // Set status to published so posts are immediately visible
    };

    try {
      await payload.create({ collection: 'posts', data: postData });
    } catch (slugError) {
      const msg = slugError instanceof Error ? slugError.message : '';
      if (msg.includes('slug')) {
        // Slug conflict — retry with legacyId suffix for uniqueness
        const dedupedSlug = `${slug}-${post.id}`;
        logger.warn(`Slug conflict for post ${post.id}, retrying with: ${dedupedSlug}`);
        await payload.create({ collection: 'posts', data: { ...postData, slug: dedupedSlug } });
      } else {
        throw slugError;
      }
    }

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
  logger.info(`Target: ${options.to}`);
  if (options.startId) {
    logger.info(`Starting from ID: ${options.startId}`);
  }
  if (options.storiesStartId) {
    logger.info(`Stories starting from ID: ${options.storiesStartId}`);
  }
  if (options.customTextsStartId) {
    logger.info(`Custom texts starting from ID: ${options.customTextsStartId}`);
  }
  if (options.syncActive) {
    logger.info('Sync-active mode: will refresh changed active stories');
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

    // Phase 1: sync-active — refresh changed active stories before importing new ones
    if (options.syncActive) {
      const syncStats = await syncActiveStories(mysqlConnection, payload);
      logger.info(
        `[sync-active] Done: ${syncStats.refreshed} refreshed, ${syncStats.unchanged} unchanged, ${syncStats.errors} errors`,
      );

      // Phase 1b: remove deleted MySQL stories from the Postgres front page
      const deletedStats = await syncDeletedFromFrontPage(mysqlConnection, payload);
      logger.info(`[sync-deleted] Done: ${deletedStats.fixed} removed from front page`);
    }

    // Phase 2: import new records (standard flow)
    logger.info('Fetching posts from MySQL...');
    const posts = await getActivePosts(mysqlConnection, {
      startId: options.startId,
      storiesStartId: options.storiesStartId,
      customTextsStartId: options.customTextsStartId,
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

export {
  importPosts, parseArgs, importPost, storyHash, syncActiveStories, syncDeletedFromFrontPage,
};
