/* eslint-disable no-console */
// Skip Drizzle pushDevSchema — these scripts only read/write data, never alter schema
/**
 * Display Name Integrity Check
 *
 * Checks and optionally repairs missing or mismatched displayName fields
 * for DJs, Songs, and Records collections.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-display-names.ts                         # Dry run
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-display-names.ts --fix                   # Fix mode
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-display-names.ts --limit 50 --verbose    # Limited verbose run
 */

import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
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
import {
  computeDJDisplayName,
  computeMusicDisplayName,
} from './integrity-check-display-names-utils';

process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Collection check functions
// ---------------------------------------------------------------------------

async function checkDJs(
  payload: Payload,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<void> {
  let page = 1;
  let hasMore = true;
  let processed = 0;

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const result = await payload.find({
      collection: 'djs',
      limit: pageLimit,
      page,
      depth: 1,
      sort: 'id',
      where: withSinceFilter(undefined, since),
    });

    for (const doc of result.docs) {
      const raw = doc as Record<string, unknown>;
      const current = (raw.displayName as string) || '';
      const expected = await computeDJDisplayName(payload, raw);
      const identifier = current || `DJ #${raw.id}`;

      if (verbose) {
        console.log(`  [DJ ${raw.id}] current="${current}" expected="${expected}"`);
      }

      if (!current) {
        let status: 'missing' | 'fixed' | 'fix-failed' = 'missing';
        if (fix) {
          try {
            await payload.update({
              collection: 'djs',
              id: raw.id as number,
              data: { displayName: expected },
            });
            status = 'fixed';
          } catch (err) {
            status = 'fix-failed';
            if (verbose) {
              console.error(`    Fix failed for DJ ${raw.id}:`, err);
            }
          }
        }
        addResult(report, {
          id: raw.id as number,
          collection: 'DJs',
          identifier,
          field: 'displayName',
          status,
          currentValue: '(empty)',
          expectedValue: expected,
        });
      } else if (current !== expected) {
        let status: 'mismatch' | 'fixed' | 'fix-failed' = 'mismatch';
        if (fix) {
          try {
            await payload.update({
              collection: 'djs',
              id: raw.id as number,
              data: { displayName: expected },
            });
            status = 'fixed';
          } catch (err) {
            status = 'fix-failed';
            if (verbose) {
              console.error(`    Fix failed for DJ ${raw.id}:`, err);
            }
          }
        }
        addResult(report, {
          id: raw.id as number,
          collection: 'DJs',
          identifier,
          field: 'displayName',
          status,
          currentValue: current,
          expectedValue: expected,
        });
      } else {
        addResult(report, {
          id: raw.id as number,
          collection: 'DJs',
          identifier,
          field: 'displayName',
          status: 'ok',
        });
      }

      processed += 1;
      if (limit && processed >= limit) break;
    }

    hasMore = result.hasNextPage && (!limit || processed < limit);
    page += 1;
  }
}

async function checkMusicCollection(
  payload: Payload,
  report: CheckReport,
  collectionSlug: 'songs' | 'records',
  entityType: 'Song' | 'Record',
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<void> {
  let page = 1;
  let hasMore = true;
  let processed = 0;
  const collectionLabel = entityType === 'Song' ? 'Songs' : 'Records';

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const result = await payload.find({
      collection: collectionSlug,
      limit: pageLimit,
      page,
      depth: 1,
      sort: 'id',
      where: withSinceFilter(undefined, since),
    });

    for (const doc of result.docs) {
      const raw = doc as Record<string, unknown>;
      const current = (raw.displayName as string) || '';
      const expected = await computeMusicDisplayName(payload, raw, entityType);
      const identifier = current || `${entityType} #${raw.id}`;

      if (verbose) {
        console.log(`  [${entityType} ${raw.id}] current="${current}" expected="${expected}"`);
      }

      if (!current) {
        let status: 'missing' | 'fixed' | 'fix-failed' = 'missing';
        if (fix) {
          try {
            await payload.update({
              collection: collectionSlug,
              id: raw.id as number,
              data: { displayName: expected },
            });
            status = 'fixed';
          } catch (err) {
            status = 'fix-failed';
            if (verbose) {
              console.error(`    Fix failed: ${entityType} ${raw.id}:`, err);
            }
          }
        }
        addResult(report, {
          id: raw.id as number,
          collection: collectionLabel,
          identifier,
          field: 'displayName',
          status,
          currentValue: '(empty)',
          expectedValue: expected,
        });
      } else if (current !== expected) {
        let status: 'mismatch' | 'fixed' | 'fix-failed' = 'mismatch';
        if (fix) {
          try {
            await payload.update({
              collection: collectionSlug,
              id: raw.id as number,
              data: { displayName: expected },
            });
            status = 'fixed';
          } catch (err) {
            status = 'fix-failed';
            if (verbose) {
              console.error(`    Fix failed: ${entityType} ${raw.id}:`, err);
            }
          }
        }
        addResult(report, {
          id: raw.id as number,
          collection: collectionLabel,
          identifier,
          field: 'displayName',
          status,
          currentValue: current,
          expectedValue: expected,
        });
      } else {
        addResult(report, {
          id: raw.id as number,
          collection: collectionLabel,
          identifier,
          field: 'displayName',
          status: 'ok',
        });
      }

      processed += 1;
      if (limit && processed >= limit) break;
    }

    hasMore = result.hasNextPage && (!limit || processed < limit);
    page += 1;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n📝 Display Name Integrity Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit} per collection`);
  if (options.since) console.log(`   Since: ${options.since}`);
  if (options.verbose) console.log('   Verbose: on');

  const payload = await getPayload({ config });
  const report = emptyReport('display-names', 'Display Names');
  const start = Date.now();

  console.log('\n⏳ Checking DJs...');
  await checkDJs(payload, report, options.limit, options.fix, options.verbose, options.since);

  console.log('⏳ Checking Songs...');
  await checkMusicCollection(
    payload,
    report,
    'songs',
    'Song',
    options.limit,
    options.fix,
    options.verbose,
    options.since,
  );

  console.log('⏳ Checking Records...');
  await checkMusicCollection(
    payload,
    report,
    'records',
    'Record',
    options.limit,
    options.fix,
    options.verbose,
    options.since,
  );

  report.durationMs = Date.now() - start;

  printCheckReport(report);

  const integrityReport: IntegrityReport = {
    checks: [report],
    generatedAt: new Date().toISOString(),
    mode: options.fix ? 'fix' : 'check',
  };

  if (options.output) {
    writeReport(integrityReport, options.output);
  }

  if (!options.fix) {
    console.log('\n💡 This was a dry run. Use --fix to update records.\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
