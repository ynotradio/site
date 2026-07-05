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
import { cleanHeadline } from './shared/slugify';

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
      // Don't send slug on update — the post already has a valid (date-prefixed)
      // slug and Payload's postSlugify hook owns slug generation. Forcing a
      // bare slug here collides with same-headline custom-text posts.
      await payload.update({ collection: 'posts', id: existingDoc.id, data });
      console.log(`✏️  [${s.id}] Updated "${cleanedHeadline}" (priority ${s.priority})`);
    } else {
      // New docs: let the postSlugify hook derive a date-prefixed slug from the
      // headline + startDate (avoids collisions by construction).
      data.migratedAt = new Date().toISOString();
      await payload.create({ collection: 'posts', data });
      console.log(`✅ [${s.id}] Created  "${cleanedHeadline}" (priority ${s.priority})`);
    }
  }

  // Hide stories that would still render on the front page (showOnFrontPage =
  // true and a date window covering today) but are no longer in the prod MySQL
  // active set. Without this, a story dropped from production lingers on the
  // Postgres front page. Keeps the two sources in lockstep.
  const activeIds = new Set(stories.map((s) => s.id));
  const today = new Date().toISOString().slice(0, 10);
  const frontPage = await payload.find({
    collection: 'posts',
    where: { showOnFrontPage: { equals: true } },
    limit: 1000,
    depth: 0,
  });

  const staleActive = (frontPage.docs as any[]).filter((doc) => {
    if (activeIds.has(doc.legacyId)) return false;
    const start = (doc.startDate ?? '').slice(0, 10);
    const end = (doc.endDate ?? '').slice(0, 10);
    // Stories whose window no longer covers today are already excluded by the
    // date-window read query, so only those still in-window need hiding.
    return start && end && start <= today && end >= today;
  });

  for (const doc of staleActive) {
    await payload.update({
      collection: 'posts',
      id: doc.id,
      data: { showOnFrontPage: false },
    });
    console.log(`🙈 [${doc.legacyId}] Hidden stale front-page story "${String(doc.headline).replace(/<[^>]+>/g, '').slice(0, 50)}"`);
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
