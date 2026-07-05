#!/usr/bin/env tsx
/**
 * Backfill script for mirror text fields and related data:
 * - cdoftheweek.recordText (searchable)
 * - cdoftheweek.artistUrl (from linked Record → Artist.website)
 * - artists.website (from linked CD of the Week if artist has no URL)
 * - ondemand.artistsText
 * - ondemand.songsText
 *
 * Existing rows created before these fields/hooks were introduced may have blank values.
 * This script re-saves relationship fields to trigger beforeChange hooks and populate them.
 * For CD of the Week records:
 * - populates artistUrl from the linked artist's website
 * - updates the artist's website if blank and cdoftheweek has an artistUrl
 *
 * Usage:
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --to local-postgres
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --to prod-neon --dry-run
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --to dev-neon --limit 20
 */

import type { Payload } from 'payload';
import { getPayloadClient, type PostgresTarget } from './migrations/shared/payloadClient';

/* eslint-disable no-console */

type TargetCollection = 'cdoftheweek' | 'ondemand' | 'artists';

interface CliOptions {
  target: PostgresTarget;
  dryRun: boolean;
  collections: TargetCollection[];
  limit?: number;
}

interface BackfillStats {
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
}

type DocOutcome =
  | { skip: true; warn?: string }
  | {
    skip: false;
    data: Record<string, unknown>;
    dryRunLog: string;
    artistUpdateData?: { artistId: string | number; website: string; artistName: string };
  };

const VALID_TARGETS: PostgresTarget[] = ['local-postgres', 'prod-neon', 'dev-neon', 'dev', 'prod'];
const VALID_COLLECTIONS: TargetCollection[] = ['cdoftheweek', 'ondemand', 'artists'];
const PAGE_SIZE = 100;

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === '';
}

function printUsage(): void {
  console.log(`
Usage:
  tsx --import ./bin/preload-nextenv-fix.mjs bin/backfill-search-text-fields.ts [options]

Options:
  --to <target>                local-postgres | prod-neon | dev-neon | dev | prod (default: prod-neon)
  --collection <collection>    cdoftheweek | ondemand (repeatable; default: both)
  --dry-run                    Show what would be updated without saving
  --limit <number>             Limit records processed (for testing)
  --help                       Show this help
`);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let target: PostgresTarget = 'prod-neon';
  let dryRun = false;
  let limit: number | undefined;
  const collections: TargetCollection[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--to') {
      const value = args[i + 1];
      if (!value || !VALID_TARGETS.includes(value as PostgresTarget)) {
        console.error(`Error: --to must be one of: ${VALID_TARGETS.join(', ')}`);
        process.exit(1);
      }
      target = value as PostgresTarget;
      i += 1;
    } else if (arg === '--collection') {
      const value = args[i + 1];
      if (!value || !VALID_COLLECTIONS.includes(value as TargetCollection)) {
        console.error(`Error: --collection must be one of: ${VALID_COLLECTIONS.join(', ')}`);
        process.exit(1);
      }
      collections.push(value as TargetCollection);
      i += 1;
    } else if (arg === '--limit') {
      const value = args[i + 1];
      const parsed = parseInt(value, 10);
      if (!value || Number.isNaN(parsed) || parsed < 1) {
        console.error('Error: --limit must be a positive integer');
        process.exit(1);
      }
      limit = parsed;
      i += 1;
    } else {
      console.error(`Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  return {
    target,
    dryRun,
    collections: collections.length > 0 ? [...new Set(collections)] : VALID_COLLECTIONS,
    limit,
  };
}

function cdOfTheWeekHandler(doc: Record<string, unknown>): DocOutcome {
  const recordTextBlank = isBlank(doc.recordText);
  const artistUrlBlank = isBlank(doc.artistUrl);

  if (recordTextBlank && artistUrlBlank) return { skip: true };

  const raw = doc.record;
  const recordId = typeof raw === 'object' && raw !== null && 'id' in raw ? (raw as { id: unknown }).id : raw;

  if (!recordId) return { skip: true, warn: `⚠️  cdoftheweek:${doc.id} has no record relation; skipping` };

  const updateData: Record<string, unknown> = { record: recordId };
  const logs: string[] = [];

  if (recordTextBlank) {
    logs.push(`regenerate recordText from record ${recordId}`);
  }

  let artistUpdateData:
  | { artistId: string | number; website: string; artistName: string }
  | undefined;

  if (typeof raw === 'object' && raw !== null) {
    const recordArtist = (raw as Record<string, unknown>).artist;
    if (recordArtist && typeof recordArtist === 'object') {
      const artistId = 'id' in recordArtist ? (recordArtist as Record<string, unknown>).id : null;
      const artistName = (recordArtist as Record<string, unknown>).name || 'unknown artist';
      const artistWebsite = (recordArtist as Record<string, unknown>).website;

      // If CD of the Week has an artistUrl but the artist doesn't have a website, sync it
      if (!isBlank(doc.artistUrl) && isBlank(artistWebsite) && artistId) {
        artistUpdateData = {
          artistId,
          website: String(doc.artistUrl),
          artistName,
        };
        logs.push(`sync artist ${artistName} website from CD of Week artistUrl = ${doc.artistUrl}`);
      }

      // If artistUrl is blank, populate from artist.website
      if (artistUrlBlank && !isBlank(artistWebsite)) {
        updateData.artistUrl = artistWebsite;
        logs.push(`populate artistUrl from ${artistName}.website = ${artistWebsite}`);
      }
    }
  }

  if (logs.length === 0) return { skip: true };

  return {
    skip: false,
    data: updateData,
    dryRunLog: `[DRY RUN] cdoftheweek:${doc.id} -> ${logs.join('; ')}`,
    artistUpdateData,
  };
}

function onDemandHandler(doc: Record<string, unknown>): DocOutcome {
  if (!isBlank(doc.artistsText) && !isBlank(doc.songsText)) return { skip: true };
  const data: Record<string, unknown> = {};
  if ('artists' in doc) data.artists = doc.artists;
  if ('songs' in doc) data.songs = doc.songs;
  if (Object.keys(data).length === 0) {
    return {
      skip: true,
      warn: `⚠️  ondemand:${doc.id} has no artists/songs fields to resave; skipping`,
    };
  }
  return {
    skip: false,
    data,
    dryRunLog: `[DRY RUN] ondemand:${doc.id} -> regenerate artistsText/songsText`,
  };
}

function artistsHandler(doc: Record<string, unknown>): DocOutcome {
  // Artists are updated from CD of the Week records, not directly
  // Skip if website is already present
  if (!isBlank(doc.website)) return { skip: true };
  // Otherwise also skip - artists will be updated via CD of the Week backfill
  return { skip: true };
}

const HANDLERS: Record<TargetCollection, (doc: Record<string, unknown>) => DocOutcome> = {
  cdoftheweek: cdOfTheWeekHandler,
  ondemand: onDemandHandler,
  artists: artistsHandler,
};

async function backfillCollection(
  payload: Payload,
  collection: TargetCollection,
  dryRun: boolean,
  limit?: number,
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    scanned: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };
  const handleDoc = HANDLERS[collection];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const depth = collection === 'cdoftheweek' ? 2 : 0;
    const result = await payload.find({
      collection,
      page,
      limit: PAGE_SIZE,
      depth,
      sort: 'id',
      overrideAccess: true,
    });

    for (const doc of result.docs as Array<Record<string, unknown>>) {
      stats.scanned += 1;

      if (limit && stats.scanned > limit) {
        hasNextPage = false;
        break;
      }

      const outcome = handleDoc(doc);
      if (outcome.skip) {
        if (outcome.warn) console.warn(outcome.warn);
        stats.skipped += 1;
      } else if (dryRun) {
        console.log(outcome.dryRunLog);
        if (outcome.artistUpdateData) {
          const { artistId, website, artistName } = outcome.artistUpdateData;
          console.log(`[DRY RUN] artists:${artistId} -> update ${artistName}.website = ${website}`);
        }
        stats.updated += 1;
      } else {
        try {
          await payload.update({
            collection,
            id: doc.id as number,
            data: outcome.data,
            depth: 0,
            overrideAccess: true,
          });
          stats.updated += 1;

          // Also update artist if needed
          if (outcome.artistUpdateData) {
            const { artistId, website } = outcome.artistUpdateData;
            try {
              await payload.update({
                collection: 'artists',
                id: artistId,
                data: { website },
                depth: 0,
                overrideAccess: true,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.error(`❌ Failed to update artist:${artistId} - ${message}`);
              stats.errors += 1;
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed ${collection}:${doc.id} - ${message}`);
          stats.errors += 1;
        }
      }
    }

    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return stats;
}

function printCollectionSummary(collection: TargetCollection, stats: BackfillStats): void {
  console.log(`\n📦 ${collection}`);
  console.log(`   scanned: ${stats.scanned}`);
  console.log(`   updated: ${stats.updated}`);
  console.log(`   skipped: ${stats.skipped}`);
  console.log(`   errors : ${stats.errors}`);
}

async function main(): Promise<void> {
  const options = parseArgs();
  const modeLabel = options.dryRun ? ' (DRY RUN)' : '';

  console.log(`\n🔄 Backfilling searchable text fields${modeLabel}`);
  console.log(`   target: ${options.target}`);
  console.log(`   collections: ${options.collections.join(', ')}`);
  if (options.limit) {
    console.log(`   limit: ${options.limit}`);
  }

  const payload = await getPayloadClient(options.target);
  let totalErrors = 0;

  for (const collection of options.collections) {
    const stats = await backfillCollection(payload, collection, options.dryRun, options.limit);

    totalErrors += stats.errors;
    printCollectionSummary(collection, stats);
  }

  if (options.dryRun) {
    console.log('\n⚠️  Dry run only. No records were updated.');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
