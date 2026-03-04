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
import type { Payload } from 'payload';
import { getPayloadClient } from './shared/payloadClient';
import { createLogger, logSummary } from './shared/logger';
import { importImageFromUrl } from './shared/mediaImporter';
import type { PostgresTarget } from './shared/payloadClient';

// eslint-disable-next-line import/no-extraneous-dependencies, @typescript-eslint/no-require-imports
const nextEnv = require('@next/env');

if (!nextEnv.default) {
  nextEnv.default = nextEnv;
}

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

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (!value) continue;

    switch (flag) {
      case '--to':
        options.to = value as PostgresTarget;
        break;
      case '--limit':
        options.limit = parseInt(value, 10);
        break;
      case '--ids':
        options.ids = value.split(',').map((id) => parseInt(id.trim(), 10));
        break;
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

  // Re-read the media record to get the correct Cloudinary URL.
  // The cloud storage afterChange hook updates filename/url asynchronously
  // after payload.create returns, so the initial result may have stale values.
  const media = await payload.findByID({
    collection: 'media',
    id: imageResult.mediaId,
  });
  const mediaUrl = (media as Record<string, unknown>).url as string;
  const cloudinaryUrl = mediaUrl || imageResult.cloudinaryUrl;

  await payload.update({
    collection: 'posts',
    id: postId,
    data: {
      image: imageResult.mediaId,
    },
  });

  logger.info(`✓ Post ${postId}: media ${imageResult.mediaId} (${cloudinaryUrl})`);
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
      where.and = [...(where.and as Array<Record<string, unknown>>), { id: { in: options.ids } }];
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
        continue;
      }

      try {
        const success = await backfillPostMedia(payload, post.id as number, imageUrl, headline);
        stats[success ? 'success' : 'errors'] += 1;
      } catch (error) {
        logger.error(`Error processing post ${post.id}: ${error}`);
        stats.errors += 1;
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
