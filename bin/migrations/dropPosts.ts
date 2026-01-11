#!/usr/bin/env tsx
/**
 * Drop all records from the Posts collection
 * Use with caution - this deletes all posts!
 */

import { getPayloadClient } from './shared/payloadClient';
import { createLogger } from './shared/logger';

const logger = createLogger('DropPosts');

async function dropPosts() {
  const payload = await getPayloadClient('dev');

  try {
    logger.info('Fetching all posts...');

    // Get all posts
    const result = await payload.find({
      collection: 'posts',
      limit: 10000,
      pagination: false,
    });

    logger.info(`Found ${result.docs.length} posts to delete`);

    // Delete each post
    let deleted = 0;
    for (const post of result.docs) {
      try {
        await payload.delete({
          collection: 'posts',
          id: post.id,
        });
        deleted += 1;
        if (deleted % 10 === 0) {
          logger.info(`Deleted ${deleted}/${result.docs.length} posts...`);
        }
      } catch (error) {
        logger.error(`Failed to delete post ${post.id}:`, error);
      }
    }

    logger.info(`✅ Successfully deleted ${deleted} posts`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to drop posts:', error);
    process.exit(1);
  }
}

dropPosts();
