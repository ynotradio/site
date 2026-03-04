#!/usr/bin/env tsx
/**
 * Fix posts image_url and link_url in Neon PostgreSQL
 *
 * The original import incorrectly mapped MySQL `pic_url` (link target) to `image_url`.
 * This script:
 * 1. Reads correct `pic` and `pic_url` from MySQL
 * 2. Updates `image_url` (pic) and `link_url` (pic_url) in Neon
 *
 * Usage:
 *   DB_HOST=localhost tsx bin/migrations/fixPostsImageUrls.ts
 */

import pg from 'pg';
import { connectToDatabase } from './database';
import { logSummary } from './shared/logger';

const { Client } = pg;

interface FixStats {
  total: number;
  success: number;
  skipped: number;
  errors: number;
}

async function main() {
  const stats: FixStats = {
    total: 0,
    success: 0,
    skipped: 0,
    errors: 0,
  };

  // Connect to MySQL (source of truth for pic/pic_url)
  console.log('Connecting to MySQL...');
  const mysqlConn = await connectToDatabase();

  // Connect to Neon via pg
  const neonUrl = process.env.NEON_PROD_DATABASE_URL || process.env.DATABASE_URI;
  if (!neonUrl) {
    throw new Error('NEON_PROD_DATABASE_URL or DATABASE_URI must be set');
  }
  console.log('Connecting to Neon...');
  const pgClient = new Client({ connectionString: neonUrl });
  await pgClient.connect();

  // Fetch all stories from MySQL with pic and pic_url
  const [stories] = await mysqlConn.query('SELECT id, pic, pic_url FROM stories ORDER BY id');
  console.log(`Fetched ${(stories as any[]).length} stories from MySQL`);

  for (const story of stories as any[]) {
    stats.total++;

    try {
      const pic = (story.pic || '').trim();
      const picUrl = (story.pic_url || '').trim();

      // Find matching post in Neon by legacy_id
      const existing = await pgClient.query(
        'SELECT id, image_url, link_url FROM posts WHERE legacy_id = $1',
        [story.id],
      );

      if (existing.rows.length === 0) {
        stats.skipped++;
      } else {
        const post = existing.rows[0];
        const needsUpdate = post.image_url !== pic || post.link_url !== picUrl;

        if (!needsUpdate) {
          stats.skipped++;
        } else {
          // Update the post with correct values
          await pgClient.query('UPDATE posts SET image_url = $1, link_url = $2 WHERE id = $3', [
            pic,
            picUrl,
            post.id,
          ]);
          console.log(
            `Updated post ${post.id} (legacy ${story.id}): image_url="${pic.substring(0, 40)}", link_url="${picUrl.substring(0, 40)}"`,
          );
          stats.success++;
        }
      }
    } catch (error) {
      console.error(`Error fixing story ${story.id}: ${error}`);
      stats.errors++;
    }
  }

  await mysqlConn.end();
  await pgClient.end();
  console.log('Connections closed');

  logSummary(stats);
}

main().catch((error) => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});
