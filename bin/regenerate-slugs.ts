#!/usr/bin/env tsx
/**
 * Bulk script for re-generating slugs for Payload CMS collections.
 *
 * Supports: artists, people, venues, songs, records, cdoftheweek, posts
 *
 * Usage:
 *   tsx bin/regenerate-slugs.ts --collection songs --to local-postgres
 *   tsx bin/regenerate-slugs.ts --all --to local-postgres --dry-run
 *   tsx bin/regenerate-slugs.ts --collection posts --to prod-neon
 *
 * Options:
 *   --collection <name>  Collection to regenerate (can be specified multiple times)
 *   --all                Regenerate all collections with slugs
 *   --to <target>        Target database: 'local-postgres' or 'prod-neon' (default)
 *   --dry-run            Preview changes without saving
 */

import type { Payload } from 'payload';
import { getPayloadClient, type PostgresTarget } from './migrations/shared/payloadClient';
import { slugifyText } from '../payload/src/collections/hooks/musicSlugify';

/* eslint-disable no-console */

// ---------------------------------------------------------------------------
// Slug generation helpers (mirrors the logic in collection hooks)
// ---------------------------------------------------------------------------

/** Generate slug for collections that use the default Payload slugField (from `name`). */
function generateNameSlug(name: string): string {
  return slugifyText(name);
}

/** Generate slug for Posts (from `headline`). */
function generatePostSlug(headline: string): string {
  return headline
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
}

/**
 * Generate slug for Songs / Records (artist-name--title format).
 * Resolves artist relationship IDs to names when needed.
 */
async function generateMusicSlug(
  payload: Payload,
  doc: Record<string, unknown>,
): Promise<string | null> {
  const title = doc.title as string | undefined;
  if (!title) return null;

  const titleSlug = slugifyText(title);
  if (!titleSlug) return null;

  // Resolve artist name
  let artistName = '';
  const { artist } = doc;

  if (artist && typeof artist === 'object' && artist !== null && 'name' in artist) {
    artistName = String((artist as { name: unknown }).name || '');
  } else if (artist) {
    // artist is an ID – look it up
    try {
      const found = await payload.findByID({
        collection: 'artists',
        id: artist as number,
      });
      artistName = found?.name || '';
    } catch {
      // leave empty
    }
  }

  if (artistName) {
    const artistSlug = slugifyText(artistName);
    if (artistSlug) {
      return `${artistSlug}--${titleSlug}`;
    }
  }

  return titleSlug;
}

/**
 * Generate slug for CdOfTheWeek (derives from associated record's artist + title).
 * Computes the expected slug rather than copying the record's current slug,
 * so it works correctly even when record slugs haven't been regenerated yet.
 */
async function generateCdOfTheWeekSlug(
  payload: Payload,
  doc: Record<string, unknown>,
): Promise<string | null> {
  const { record } = doc;
  if (!record) return null;

  const recordId = typeof record === 'object' && record !== null && 'id' in record
    ? (record as { id: unknown }).id
    : record;

  try {
    const found = await payload.findByID({
      collection: 'records',
      id: recordId as number,
      depth: 1,
    });
    if (!found) return null;

    // Compute the correct slug from the record's data (same as generateMusicSlug)
    return await generateMusicSlug(payload, found as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Collection config: how to compute the expected slug for each collection
// ---------------------------------------------------------------------------

type SlugGenerator = (
  payload: Payload,
  doc: Record<string, unknown>,
) => Promise<string | null> | string | null;

interface CollectionSlugConfig {
  collection: string;
  label: string;
  generateSlug: SlugGenerator;
}

const COLLECTION_CONFIGS: CollectionSlugConfig[] = [
  {
    collection: 'artists',
    label: 'Artists',
    generateSlug: (_p, doc) => generateNameSlug(doc.name as string),
  },
  {
    collection: 'people',
    label: 'People',
    generateSlug: (_p, doc) => generateNameSlug(doc.name as string),
  },
  {
    collection: 'venues',
    label: 'Venues',
    generateSlug: (_p, doc) => generateNameSlug(doc.name as string),
  },
  {
    collection: 'songs',
    label: 'Songs',
    generateSlug: (p, doc) => generateMusicSlug(p, doc),
  },
  {
    collection: 'records',
    label: 'Records',
    generateSlug: (p, doc) => generateMusicSlug(p, doc),
  },
  {
    collection: 'cdoftheweek',
    label: 'CDs of the Week',
    generateSlug: (p, doc) => generateCdOfTheWeekSlug(p, doc),
  },
  {
    collection: 'posts',
    label: 'Posts',
    generateSlug: (_p, doc) => generatePostSlug(doc.headline as string),
  },
];

const VALID_COLLECTIONS = COLLECTION_CONFIGS.map((c) => c.collection);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliOptions {
  collections: string[];
  target: PostgresTarget;
  dryRun: boolean;
}

function printUsage(): void {
  console.log(`
Usage:
  tsx bin/regenerate-slugs.ts --collection <name> [--to <target>] [--dry-run]
  tsx bin/regenerate-slugs.ts --all [--to <target>] [--dry-run]

Collections: ${VALID_COLLECTIONS.join(', ')}
Targets:     local-postgres, prod-neon (default)
`);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const collections: string[] = [];
  let target: PostgresTarget = 'prod-neon';
  let dryRun = false;
  let all = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--collection':
        i++;
        if (!args[i]) {
          console.error('Error: --collection requires a value');
          process.exit(1);
        }
        if (!VALID_COLLECTIONS.includes(args[i])) {
          console.error(
            `Error: Unknown collection "${args[i]}". Valid: ${VALID_COLLECTIONS.join(', ')}`,
          );
          process.exit(1);
        }
        collections.push(args[i]);
        break;
      case '--all':
        all = true;
        break;
      case '--to':
        i++;
        if (args[i] !== 'local-postgres' && args[i] !== 'prod-neon') {
          console.error('Error: --to must be "local-postgres" or "prod-neon"');
          process.exit(1);
        }
        target = args[i] as PostgresTarget;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  if (all) {
    return { collections: VALID_COLLECTIONS, target, dryRun };
  }

  if (collections.length === 0) {
    console.error('Error: Specify --collection <name> (repeatable) or --all');
    printUsage();
    process.exit(1);
  }

  return { collections, target, dryRun };
}

// ---------------------------------------------------------------------------
// Bulk regeneration logic
// ---------------------------------------------------------------------------

interface RegenerateStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

const PAGE_SIZE = 100;

async function regenerateCollection(
  payload: Payload,
  config: CollectionSlugConfig,
  dryRun: boolean,
): Promise<RegenerateStats> {
  const stats: RegenerateStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await payload.find({
      collection: config.collection as any,
      limit: PAGE_SIZE,
      page,
      sort: 'id',
      depth: 1, // populate one level so artist objects are available
    });

    for (const doc of result.docs) {
      stats.total++;
      const entry = doc as unknown as Record<string, unknown>;

      try {
        const expectedSlug = await config.generateSlug(payload, entry);

        if (!expectedSlug) {
          stats.skipped++;
        } else {
          const currentSlug = entry.slug as string | undefined;

          if (currentSlug === expectedSlug) {
            stats.skipped++;
          } else if (dryRun) {
            console.log(`  [DRY RUN] ID ${entry.id}: "${currentSlug}" → "${expectedSlug}"`);
            stats.updated++;
          } else {
            await payload.update({
              collection: config.collection as any,
              id: entry.id as number,
              data: { slug: expectedSlug } as any,
            });
            console.log(`  Updated ID ${entry.id}: "${currentSlug}" → "${expectedSlug}"`);
            stats.updated++;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  Error processing ID ${entry.id}: ${message}`);
        stats.errors++;
      }
    }

    hasMore = result.hasNextPage;
    page++;
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs();
  const modeLabel = options.dryRun ? ' (DRY RUN)' : '';

  console.log(`\n🔄 Regenerating slugs${modeLabel}`);
  console.log(`   Target: ${options.target}`);
  console.log(`   Collections: ${options.collections.join(', ')}\n`);

  const payload = await getPayloadClient(options.target);

  const allStats: Record<string, RegenerateStats> = {};

  for (const collectionSlug of options.collections) {
    const collectionConfig = COLLECTION_CONFIGS.find((c) => c.collection === collectionSlug);
    if (!collectionConfig) {
      // eslint shouldn't reach here due to CLI validation, but guard anyway
      console.warn(`⚠️  Unknown collection: ${collectionSlug}, skipping`);
    } else {
      console.log(`📦 ${collectionConfig.label} (${collectionConfig.collection}):`);
      const stats = await regenerateCollection(payload, collectionConfig, options.dryRun);
      allStats[collectionConfig.collection] = stats;

      console.log(
        `   ✅ ${stats.total} total, ${stats.updated} updated, `
          + `${stats.skipped} unchanged, ${stats.errors} errors\n`,
      );
    }
  }

  // Summary
  console.log('📊 Summary:');
  let grandTotal = 0;
  let grandUpdated = 0;
  let grandErrors = 0;
  for (const [collection, stats] of Object.entries(allStats)) {
    console.log(`   ${collection}: ${stats.updated}/${stats.total} updated`);
    grandTotal += stats.total;
    grandUpdated += stats.updated;
    grandErrors += stats.errors;
  }
  console.log(`\n   Total: ${grandUpdated}/${grandTotal} slugs regenerated, ${grandErrors} errors`);

  if (options.dryRun) {
    console.log('\n⚠️  Dry run – no changes were saved. Remove --dry-run to apply.');
  }

  process.exit(grandErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
