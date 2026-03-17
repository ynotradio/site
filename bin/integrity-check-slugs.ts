/* eslint-disable no-console */
// Skip Drizzle pushDevSchema — these scripts only read/write data, never alter schema
/**
 * Slug Integrity Check
 *
 * Verifies that imported entities (those with legacyId) have correct slugs
 * matching what the slug hooks would produce. Optionally fixes mismatches.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-slugs.ts
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-slugs.ts --fix
 *   node --import ./bin/preload-nextenv-fix.mjs \
 *     --import tsx bin/integrity-check-slugs.ts --limit 50 --verbose
 */

import { getPayload, type Payload } from 'payload';
// eslint-disable-next-line import/no-cycle
import config from '@payload-config';
import { slugifyText } from '../payload/src/collections/hooks/musicSlugify';
import {
  parseArgs,
  emptyReport,
  addResult,
  printCheckReport,
  writeReport,
  withSinceFilter,
  type CheckReport,
  type IntegrityReport,
} from './content-integrity-utils';

process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Slug generation helpers (mirrors the logic in collection hooks)
// ---------------------------------------------------------------------------

export function generateNameSlug(name: string): string {
  return slugifyText(name);
}

export function generatePostSlug(headline: string): string {
  return headline
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

export async function generateMusicSlug(
  payload: Payload,
  doc: Record<string, unknown>,
): Promise<string | null> {
  const title = doc.title as string | undefined;
  if (!title) return null;

  const titleSlug = slugifyText(title);
  if (!titleSlug) return null;

  let artistName = '';
  const { artist } = doc;

  if (artist && typeof artist === 'object' && artist !== null && 'name' in artist) {
    artistName = String((artist as { name: unknown }).name || '');
  } else if (artist) {
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
    if (artistSlug) return `${artistSlug}--${titleSlug}`;
  }

  return titleSlug;
}

export async function generateCdOfTheWeekSlug(
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
    return await generateMusicSlug(payload, found as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Collection config
// ---------------------------------------------------------------------------

type SlugGenerator = (
  payload: Payload,
  doc: Record<string, unknown>,
) => Promise<string | null> | string | null;

interface CollectionSlugConfig {
  collection: string;
  label: string;
  identifierField: string;
  generateSlug: SlugGenerator;
}

const COLLECTION_CONFIGS: CollectionSlugConfig[] = [
  {
    collection: 'songs',
    label: 'Songs',
    identifierField: 'title',
    generateSlug: (p, doc) => generateMusicSlug(p, doc),
  },
  {
    collection: 'records',
    label: 'Records',
    identifierField: 'title',
    generateSlug: (p, doc) => generateMusicSlug(p, doc),
  },
  {
    collection: 'people',
    label: 'People',
    identifierField: 'name',
    generateSlug: (_p, doc) => generateNameSlug(doc.name as string),
  },
  {
    collection: 'cdoftheweek',
    label: 'CDs of the Week',
    identifierField: 'id',
    generateSlug: (p, doc) => generateCdOfTheWeekSlug(p, doc),
  },
  {
    collection: 'posts',
    label: 'Posts',
    identifierField: 'headline',
    generateSlug: (_p, doc) => generatePostSlug(doc.headline as string),
  },
];

// ---------------------------------------------------------------------------
// Check logic
// ---------------------------------------------------------------------------

async function checkCollection(
  payload: Payload,
  collectionConfig: CollectionSlugConfig,
  report: CheckReport,
  options: { fix: boolean; limit: number; verbose: boolean; since: string },
): Promise<void> {
  let page = 1;
  let hasMore = true;
  let processed = 0;

  while (hasMore) {
    const result = await payload.find({
      collection: collectionConfig.collection as 'songs',
      limit: PAGE_SIZE,
      page,
      sort: 'id',
      depth: 1,
      where: withSinceFilter({ legacyId: { exists: true } }, options.since),
    });

    for (const doc of result.docs) {
      if (options.limit > 0 && processed >= options.limit) {
        hasMore = false;
        break;
      }
      processed += 1;

      const entry = doc as unknown as Record<string, unknown>;
      const entryId = entry.id as string | number;
      const identifier = String(entry[collectionConfig.identifierField] ?? `id:${entryId}`);
      const currentSlug = (entry.slug as string | undefined) ?? '';

      try {
        const expectedSlug = await collectionConfig.generateSlug(payload, entry);

        if (!expectedSlug) {
          addResult(report, {
            id: entryId,
            collection: collectionConfig.collection,
            identifier,
            field: 'slug',
            status: 'skipped',
            currentValue: currentSlug || '(empty)',
            detail: 'Cannot compute expected slug (missing source data)',
          });
          if (options.verbose) {
            console.log(
              `  \u23ED  [${collectionConfig.collection}] ${identifier}`
                + ' \u2014 skipped (no expected slug)',
            );
          }
        } else if (!currentSlug) {
          if (options.fix) {
            try {
              await payload.update({
                collection: collectionConfig.collection as 'songs',
                id: entryId as number,
                data: {
                  slug: expectedSlug,
                } as unknown as Record<string, unknown>,
              });
              addResult(report, {
                id: entryId,
                collection: collectionConfig.collection,
                identifier,
                field: 'slug',
                status: 'fixed',
                currentValue: '(empty)',
                expectedValue: expectedSlug,
              });
              if (options.verbose) {
                console.log(
                  `  \u2705 [${collectionConfig.collection}] ${identifier}`
                    + ` \u2014 fixed (was empty \u2192 ${expectedSlug})`,
                );
              }
            } catch (err) {
              addResult(report, {
                id: entryId,
                collection: collectionConfig.collection,
                identifier,
                field: 'slug',
                status: 'fix-failed',
                currentValue: '(empty)',
                expectedValue: expectedSlug,
                detail: err instanceof Error ? err.message : String(err),
              });
            }
          } else {
            addResult(report, {
              id: entryId,
              collection: collectionConfig.collection,
              identifier,
              field: 'slug',
              status: 'missing',
              currentValue: '(empty)',
              expectedValue: expectedSlug,
            });
            if (options.verbose) {
              console.log(
                `  \u274C [${collectionConfig.collection}] ${identifier}`
                  + ` \u2014 missing slug (expected: ${expectedSlug})`,
              );
            }
          }
        } else if (currentSlug !== expectedSlug) {
          if (options.fix) {
            try {
              await payload.update({
                collection: collectionConfig.collection as 'songs',
                id: entryId as number,
                data: {
                  slug: expectedSlug,
                } as unknown as Record<string, unknown>,
              });
              addResult(report, {
                id: entryId,
                collection: collectionConfig.collection,
                identifier,
                field: 'slug',
                status: 'fixed',
                currentValue: currentSlug,
                expectedValue: expectedSlug,
              });
              if (options.verbose) {
                console.log(
                  `  \u2705 [${collectionConfig.collection}] ${identifier}`
                    + ` \u2014 fixed (${currentSlug} \u2192 ${expectedSlug})`,
                );
              }
            } catch (err) {
              addResult(report, {
                id: entryId,
                collection: collectionConfig.collection,
                identifier,
                field: 'slug',
                status: 'fix-failed',
                currentValue: currentSlug,
                expectedValue: expectedSlug,
                detail: err instanceof Error ? err.message : String(err),
              });
            }
          } else {
            addResult(report, {
              id: entryId,
              collection: collectionConfig.collection,
              identifier,
              field: 'slug',
              status: 'mismatch',
              currentValue: currentSlug,
              expectedValue: expectedSlug,
            });
            if (options.verbose) {
              console.log(
                `  \u26A0\uFE0F  [${collectionConfig.collection}] ${identifier}`
                  + ` \u2014 mismatch: "${currentSlug}" vs "${expectedSlug}"`,
              );
            }
          }
        } else {
          addResult(report, {
            id: entryId,
            collection: collectionConfig.collection,
            identifier,
            field: 'slug',
            status: 'ok',
          });
          if (options.verbose) {
            console.log(`  \u2713  [${collectionConfig.collection}] ${identifier} \u2014 ok`);
          }
        }
      } catch (err) {
        addResult(report, {
          id: entryId,
          collection: collectionConfig.collection,
          identifier,
          field: 'slug',
          status: 'fix-failed',
          currentValue: currentSlug || '(empty)',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (options.limit > 0 && processed >= options.limit) break;
    hasMore = result.hasNextPage;
    page += 1;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const modeLabel = options.fix ? 'fix' : 'check';

  console.log(`\n🔍 Slug Integrity Check (${modeLabel} mode)`);
  if (options.limit > 0) {
    console.log(`   Limit: ${options.limit} per collection`);
  }
  if (options.since) {
    console.log(`   Since: ${options.since}`);
  }
  console.log('');

  const payload = await getPayload({ config });

  const report = emptyReport('slugs', 'Slug Integrity');
  const start = Date.now();

  for (const collectionConfig of COLLECTION_CONFIGS) {
    console.log(`\uD83D\uDCE6 ${collectionConfig.label} (${collectionConfig.collection}):`);
    const beforeTotal = report.total;
    await checkCollection(payload, collectionConfig, report, options);
    const checked = report.total - beforeTotal;
    console.log(`   Checked ${checked} imported entities\n`);
  }

  report.durationMs = Date.now() - start;
  printCheckReport(report);

  if (options.output) {
    const integrityReport: IntegrityReport = {
      checks: [report],
      generatedAt: new Date().toISOString(),
      mode: options.fix ? 'fix' : 'check',
    };
    writeReport(integrityReport, options.output);
  }

  const hasIssues = report.missing + report.mismatch + report.fixFailed;
  process.exit(hasIssues > 0 ? 1 : 0);
}

// Only run main when executed directly (not when imported by tests)
const isDirectRun = process.argv[1]?.endsWith('integrity-check-slugs.ts')
  || process.argv.some((a) => a.includes('integrity-check-slugs'));

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
