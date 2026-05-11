#!/usr/bin/env tsx
/**
 * One-time backfill script for searchable mirror text fields:
 * - cdoftheweek.recordText
 * - ondemand.artistsText
 * - ondemand.songsText
 *
 * Existing rows created before these fields/hooks were introduced may have blank values.
 * This script re-saves relationship fields to trigger beforeChange hooks and populate them.
 *
 * Usage:
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --to local-postgres
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --to prod-neon --dry-run
 *   yarn tsx --import ./bin/preload-nextenv-fix.mjs
 *   bin/backfill-search-text-fields.ts --collection ondemand
 */

import type { Payload } from 'payload';
import { getPayloadClient, type PostgresTarget } from './migrations/shared/payloadClient';

/* eslint-disable no-console */

type TargetCollection = 'cdoftheweek' | 'ondemand';

interface CliOptions {
  target: PostgresTarget;
  dryRun: boolean;
  collections: TargetCollection[];
}

interface BackfillStats {
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
}

type DocOutcome =
  | { skip: true; warn?: string }
  | { skip: false; data: Record<string, unknown>; dryRunLog: string };

const VALID_TARGETS: PostgresTarget[] = ['local-postgres', 'prod-neon', 'dev-neon', 'dev', 'prod'];
const VALID_COLLECTIONS: TargetCollection[] = ['cdoftheweek', 'ondemand'];
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
  --help                       Show this help
`);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let target: PostgresTarget = 'prod-neon';
  let dryRun = false;
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
  };
}

function cdOfTheWeekHandler(doc: Record<string, unknown>): DocOutcome {
  if (!isBlank(doc.recordText)) return { skip: true };
  const raw = doc.record;
  const recordId = typeof raw === 'object' && raw !== null && 'id' in raw
    ? (raw as { id: unknown }).id
    : raw;
  if (!recordId) return { skip: true, warn: `⚠️  cdoftheweek:${doc.id} has no record relation; skipping` };
  return {
    skip: false,
    data: { record: recordId },
    dryRunLog: `[DRY RUN] cdoftheweek:${doc.id} -> regenerate recordText from record ${recordId}`,
  };
}

function onDemandHandler(doc: Record<string, unknown>): DocOutcome {
  if (!isBlank(doc.artistsText) && !isBlank(doc.songsText)) return { skip: true };
  const data: Record<string, unknown> = {};
  if ('artists' in doc) data.artists = doc.artists;
  if ('songs' in doc) data.songs = doc.songs;
  if (Object.keys(data).length === 0) {
    return { skip: true, warn: `⚠️  ondemand:${doc.id} has no artists/songs fields to resave; skipping` };
  }
  return {
    skip: false,
    data,
    dryRunLog: `[DRY RUN] ondemand:${doc.id} -> regenerate artistsText/songsText`,
  };
}

const HANDLERS: Record<TargetCollection, (doc: Record<string, unknown>) => DocOutcome> = {
  cdoftheweek: cdOfTheWeekHandler,
  ondemand: onDemandHandler,
};

async function backfillCollection(
  payload: Payload,
  collection: TargetCollection,
  dryRun: boolean,
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    scanned: 0, updated: 0, skipped: 0, errors: 0,
  };
  const handleDoc = HANDLERS[collection];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection,
      page,
      limit: PAGE_SIZE,
      depth: 0,
      sort: 'id',
      overrideAccess: true,
    });

    for (const doc of result.docs as Array<Record<string, unknown>>) {
      stats.scanned += 1;
      const outcome = handleDoc(doc);
      if (outcome.skip) {
        if (outcome.warn) console.warn(outcome.warn);
        stats.skipped += 1;
      } else if (dryRun) {
        console.log(outcome.dryRunLog);
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

  const payload = await getPayloadClient(options.target);
  let totalErrors = 0;

  for (const collection of options.collections) {
    const stats = await backfillCollection(payload, collection, options.dryRun);

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
