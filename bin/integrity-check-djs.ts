/* eslint-disable no-console */
// Skip Drizzle pushDevSchema — these scripts only read/write data, never alter schema
/**
 * DJ Integrity Check
 *
 * Checks for DJ data quality issues:
 * - Orphaned DJ records (no person linked)
 * - Duplicate display names (same name for multiple DJs)
 * - DJs with missing critical fields (display name, onAir status)
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts --fix
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-djs.ts --limit 50 --verbose
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

process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// DJ check functions
// ---------------------------------------------------------------------------

interface DJRecord {
  id: number | string;
  displayName?: string;
  person?: Array<{ id: string | number }> | { id: string | number };
  onAir?: boolean;
  sortOrder?: number;
}

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
  const djsByName = new Map<string, DJRecord[]>();

  // First pass: collect all DJs and build display name index
  const allDJs: DJRecord[] = [];
  console.log('  Fetching all DJ records...');

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
      const dj: DJRecord = {
        id: raw.id as number,
        displayName: (raw.displayName as string) || '',
        person: raw.person as DJRecord['person'],
        onAir: (raw.onAir as boolean) !== false,
        sortOrder: raw.sortOrder as number,
      };

      allDJs.push(dj);

      // Index by display name for duplicate detection
      const name = dj.displayName || `DJ #${dj.id}`;
      if (!djsByName.has(name)) {
        djsByName.set(name, []);
      }
      djsByName.get(name)!.push(dj);

      processed += 1;
      if (limit && processed >= limit) break;
    }

    hasMore = result.hasNextPage && (!limit || processed < limit);
    page += 1;
  }

  // Second pass: check each DJ for issues
  for (const dj of allDJs) {
    const identifier = dj.displayName || `DJ #${dj.id}`;
    const issues: string[] = [];

    // Check 1: Orphaned DJ (no person linked)
    const hasPerson = dj.person && (Array.isArray(dj.person) ? dj.person.length > 0 : true);
    if (!hasPerson) {
      issues.push('no-person');
    }

    // Check 2: Missing displayName
    if (!dj.displayName) {
      issues.push('no-display-name');
    }

    // Check 3: Duplicates (will report below)
    const name = dj.displayName || `DJ #${dj.id}`;
    const duplicates = djsByName.get(name) || [];
    if (duplicates.length > 1) {
      issues.push('duplicate-name');
    }

    if (verbose) {
      console.log(`  [DJ ${dj.id}] "${identifier}" issues=[${issues.join(', ')}]`);
    }

    if (issues.length === 0) {
      addResult(report, {
        id: dj.id,
        collection: 'DJs',
        identifier,
        field: 'data-quality',
        status: 'ok',
      });
    } else {
      // For orphaned DJs, we can optionally delete them in fix mode
      const detail = issues.join(', ');
      if (issues.includes('no-person') && fix) {
        try {
          if (verbose) {
            console.log(`  Attempting to delete orphaned DJ #${dj.id}...`);
          }
          await payload.delete({
            collection: 'djs',
            id: dj.id as number,
          });
          addResult(report, {
            id: dj.id,
            collection: 'DJs',
            identifier,
            field: 'orphaned',
            status: 'fixed',
            detail,
          });
        } catch (err) {
          if (verbose) {
            console.error(`    Delete failed for DJ ${dj.id}:`, err);
          }
          addResult(report, {
            id: dj.id,
            collection: 'DJs',
            identifier,
            field: 'orphaned',
            status: 'fix-failed',
            detail,
            currentValue: `Failed to delete: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      } else {
        // Report as mismatch (data quality issue)
        addResult(report, {
          id: dj.id,
          collection: 'DJs',
          identifier,
          field: 'data-quality',
          status: 'mismatch',
          detail,
          currentValue: issues.join('; '),
          expectedValue: 'No issues',
        });
      }
    }
  }

  // Third pass: report duplicates with specific IDs
  for (const [name, duplicates] of djsByName.entries()) {
    if (duplicates.length > 1) {
      const ids = duplicates.map((d) => d.id).join(', ');
      if (verbose) {
        console.log(`  Duplicate name detected: "${name}" (IDs: ${ids})`);
      }

      // Add a summary result for the duplicate group
      addResult(report, {
        id: ids,
        collection: 'DJs',
        identifier: name,
        field: 'duplicate-name',
        status: 'mismatch',
        detail: 'Multiple DJs share this display name',
        currentValue: ids,
        expectedValue: 'Only one DJ per display name',
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n🎙️  DJ Data Quality Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit}`);
  if (options.since) console.log(`   Since: ${options.since}`);
  if (options.verbose) console.log('   Verbose: on');

  const payload = await getPayload({ config });
  const report = emptyReport('djs', 'DJ Data Quality');
  const start = Date.now();

  console.log('\n⏳ Checking DJs...');
  await checkDJs(payload, report, options.limit, options.fix, options.verbose, options.since);

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
    console.log('\n💡 This was a dry run. Use --fix to delete orphaned DJs.\n');
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
