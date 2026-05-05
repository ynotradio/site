#!/usr/bin/env tsx
/**
 * Sync the currently-active stories from production MySQL into both Neon
 * databases (dev + prod) so the Postgres-backed front page matches the
 * MySQL-backed production front page.
 *
 * Usage:
 *   1. Dump active prod stories first (one JSON object per line) to
 *      tmp/prod-stories.json.
 *   2. tsx bin/migrations/sync-prod-stories-to-neon.ts
 */

import fs from 'fs';
import path from 'path';
import { getPayloadClient, type PostgresTarget } from './shared/payloadClient';
import { convertHtmlToLexical } from './shared/importUtils';
import { importImageFromUrl } from './shared/mediaImporter';
import { slugify, cleanHeadline } from './shared/slugify';

interface ProdStory {
  id: number;
  headline: string;
  story: string;
  pic: string;
  pic_url: string;
  start_date: string;
  end_date: string;
  priority: number;
}

const TARGETS: PostgresTarget[] = process.env.SYNC_TARGET
  ? [process.env.SYNC_TARGET as PostgresTarget]
  : ['dev-neon', 'prod-neon'];

// Stories present on Neon but not in prod active set — hide from front page.
const HIDE_LEGACY_IDS = [1777];

function loadStories(): ProdStory[] {
  const file = path.resolve(process.cwd(), 'tmp/prod-stories.json');
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  return lines.map((l) => JSON.parse(l) as ProdStory);
}

async function syncTarget(target: PostgresTarget, stories: ProdStory[]): Promise<void> {
  console.log(`\n${'='.repeat(60)}\n🎯 Target: ${target}\n${'='.repeat(60)}`);
  const payload = await getPayloadClient(target);

  for (const s of stories) {
    const cleanedHeadline = cleanHeadline(s.headline);
    const slug = slugify(s.headline);
    const content = convertHtmlToLexical(s.story);

    const existing = await payload.find({
      collection: 'posts',
      where: { legacyId: { equals: s.id } },
      limit: 1,
    });

    const existingDoc = existing.docs[0] as any | undefined;
    const currentImageUrl = existingDoc?.imageUrl as string | undefined;
    const needsImage = !existingDoc || currentImageUrl !== s.pic;

    let imageId: number | string | undefined = existingDoc?.image?.id ?? existingDoc?.image;
    if (needsImage && s.pic && s.pic.trim() !== '') {
      console.log(`📥 [${s.id}] Importing image: ${s.pic}`);
      const r = await importImageFromUrl(payload, s.pic, {
        alt: `Image for: ${cleanedHeadline}`,
        caption: cleanedHeadline,
        legacyUrl: s.pic,
        legacyId: s.id,
      });
      if (r.success && r.mediaId) {
        imageId = r.mediaId;
      } else {
        console.log(`   ⚠️  Image import failed: ${r.error}`);
      }
    }

    const data: Record<string, unknown> = {
      headline: cleanedHeadline,
      slug,
      startDate: s.start_date,
      endDate: s.end_date,
      content,
      imageUrl: s.pic,
      linkUrl: s.pic_url,
      priority: s.priority || 0,
      legacyId: s.id,
      showOnFrontPage: true,
      _status: 'published',
    };
    if (imageId) data.image = imageId;

    if (existingDoc) {
      await payload.update({ collection: 'posts', id: existingDoc.id, data });
      console.log(`✏️  [${s.id}] Updated "${cleanedHeadline}" (priority ${s.priority})`);
    } else {
      data.migratedAt = new Date().toISOString();
      await payload.create({ collection: 'posts', data });
      console.log(`✅ [${s.id}] Created  "${cleanedHeadline}" (priority ${s.priority})`);
    }
  }

  for (const legacyId of HIDE_LEGACY_IDS) {
    const found = await payload.find({
      collection: 'posts',
      where: { legacyId: { equals: legacyId } },
      limit: 1,
    });
    if (found.docs.length > 0) {
      await payload.update({
        collection: 'posts',
        id: found.docs[0].id,
        data: { showOnFrontPage: false },
      });
      console.log(`🙈 [${legacyId}] Hidden from front page`);
    }
  }
}

async function main(): Promise<void> {
  const stories = loadStories();
  console.log(`📰 Loaded ${stories.length} active stories from prod MySQL dump`);

  for (const target of TARGETS) {
    await syncTarget(target, stories);
  }

  console.log('\n✅ Sync complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
