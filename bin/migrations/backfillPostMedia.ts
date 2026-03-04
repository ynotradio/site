#!/usr/bin/env tsx
/**
 * Backfill Media attachments for posts that have image_url but no image relationship.
 *
 * Downloads images via the existing mediaImporter, uploads to Cloudinary via Payload,
 * and sets the `image` relationship field on each post.
 *
 * Usage:
 *   tsx bin/migrations/backfillPostMedia.ts --to prod-neon
 *   tsx bin/migrations/backfillPostMedia.ts --to prod-neon --limit 10
 *   tsx bin/migrations/backfillPostMedia.ts --to prod-neon --ids 917,1046,860
 */

// Patch @next/env before Payload imports it — fixes ESM/CJS default export mismatch
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextEnv = require('@next/env');
if (!nextEnv.default) {
  nextEnv.default = nextEnv;
}

import type { Payload } from 'payload';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import type { PostgresTarget } from './shared/payloadClient';

const logger = createLogger('MediaBackfill');

interface BackfillStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

interface BackfillOptions {
  to: PostgresTarget;
  limit?: number;
  ids?: number[];
}

function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2);
  const options: BackfillOptions = { to: 'prod-neon' };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--to' && args[i + 1]) {
      options.to = args[i + 1] as PostgresTarget;
      i += 1;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i += 1;
    } else if (args[i] === '--ids' && args[i + 1]) {
      options.ids = args[i + 1].split(',').map((id) => parseInt(id.trim(), 10));
      i += 1;
    }
  }

  return options;
}

async function backfillPostMedia(
  payload: Payload,
  postId: number,
  imageUrl: string,
  headline: string,
): Promise<boolean> {
  logger.info(`Processing post ${postId}: "${headline}" — ${imageUrl}`);

  const imageResult = await importImageFromUrl(payload, imageUrl, {
    alt: `Image for post: ${headline}`,
    caption: headline,
    legacyUrl: imageUrl,
  });

  if (!imageResult.success || !imageResult.mediaId) {
    logger.error(`Failed to import image for post ${postId}: ${imageResult.error}`);
    return false;
  }

  await payload.update({
    collection: 'posts',
    id: postId,
    data: {
      image: imageResult.mediaId,
    },
  });

  logger.info(
    `✓ Post ${postId}: media ${imageResult.mediaId} (${imageResult.cloudinaryUrl})`,
  );
  return true;
}

async function main(): Promise<void> {
  const options = parseArgs();
  logger.info(`Backfilling media for posts (target: ${options.to})`);

  const stats: BackfillStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  let payload: Payload | undefined;

  try {
    payload = await getPayloadClient(options.to);

    // Query posts that have image_url but no image relationship
    const where: Record<string, unknown> = {
      and: [
        { image: { exists: false } },
        { imageUrl: { not_equals: '' } },
        { imageUrl: { not_equals: null } },
      ],
    };

    // Filter to specific IDs if provided
    if (options.ids) {
      where.and = [
        ...(where.and as Array<Record<string, unknown>>),
        { id: { in: options.ids } },
      ];
    }

    const posts = await payload.find({
      collection: 'posts',
      where,
      limit: options.limit || 1000,
      sort: '-priority',
    });

    stats.total = posts.docs.length;
    logger.info(`Found ${stats.total} posts needing media backfill`);

    for (let i = 0; i < posts.docs.length; i += 1) {
      const post = posts.docs[i];
      const imageUrl = (post as Record<string, unknown>).imageUrl as string;
      const headline = (post as Record<string, unknown>).headline as string;

      if (!imageUrl) {
        stats.skipped += 1;
      } else {
        try {
          const success = await backfillPostMedia(payload, post.id as number, imageUrl, headline);
          if (success) {
            stats.success += 1;
          } else {
            stats.errors += 1;
          }
        } catch (error) {
          logger.error(`Error processing post ${post.id}: ${error}`);
          stats.errors += 1;
        }
      }

      if ((i + 1) % 10 === 0) {
        logger.info(`Progress: ${i + 1}/${stats.total}`);
      }
    }

    logSummary(stats);
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }

  process.exit(stats.errors > 0 ? 1 : 0);
}

main();
