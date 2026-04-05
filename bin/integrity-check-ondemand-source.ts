/* eslint-disable no-console */
/**
 * OnDemand Source Integrity Check
 *
 * For every OnDemand record that was migrated from MySQL (has a legacyId),
 * verifies that the Payload `source` field matches the value stored in the
 * MySQL `ondemand` table. Optionally fixes mismatches.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-ondemand-source.ts                         # Dry run
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-ondemand-source.ts --fix                   # Fix mode
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-ondemand-source.ts --limit 50 --verbose    # Limited verbose run
 */

import * as mysql from 'mysql2/promise';
import { getPayload, type Payload } from 'payload';
import config from '@payload-config';
import { getMySQLConfig, type MySQLSource } from '../config/databases';
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
  mapMysqlSourceToPayload,
  type PayloadSource,
} from './integrity-check-ondemand-source-utils';

// Skip Drizzle pushDevSchema — this script only reads/writes data, never alters schema
process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// MySQL helpers
// ---------------------------------------------------------------------------

/**
 * Bulk-fetch MySQL source values for a set of legacy IDs.
 * Returns a Map of legacyId → mysqlSource string.
 */
async function fetchMysqlSources(
  mysqlConn: mysql.Connection,
  legacyIds: number[],
): Promise<Map<number, string>> {
  if (legacyIds.length === 0) return new Map();

  const placeholders = legacyIds.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, source FROM ondemand WHERE id IN (${placeholders})`,
    legacyIds,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, row.source as string);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Check logic
// ---------------------------------------------------------------------------

async function checkOnDemandSource(
  payload: Payload,
  mysqlConn: mysql.Connection,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<void> {
  let page = 1;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const batch = await payload.find({
      collection: 'ondemand',
      where: withSinceFilter({ legacyId: { exists: true } }, since),
      limit: pageLimit,
      page,
      sort: 'id',
      depth: 0,
    });

    if (batch.docs.length === 0) break;

    // Gather legacy IDs for bulk MySQL lookup
    const legacyIds = batch.docs
      .map((d) => d.legacyId as number | undefined)
      .filter((id): id is number => id != null);

    const mysqlSources = await fetchMysqlSources(mysqlConn, legacyIds);

    for (const doc of batch.docs) {
      const legacyId = doc.legacyId as number | undefined;
      if (legacyId == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentSource = (doc as Record<string, unknown>).source as string | undefined;
      const mysqlSource = mysqlSources.get(legacyId);
      const identifier = (doc.headline as string) || `OnDemand #${doc.id}`;

      if (mysqlSource === undefined) {
        // MySQL record not found — can't verify, skip
        addResult(report, {
          id: doc.id,
          collection: 'ondemand',
          identifier,
          field: 'source',
          status: 'skipped',
          detail: `No MySQL record found for legacyId=${legacyId}`,
        });
        if (verbose) console.log(`  ⏭️  [${legacyId}] ${identifier} — MySQL record not found`);
      } else {
        const expected: PayloadSource = mapMysqlSourceToPayload(mysqlSource);

        if (currentSource === expected) {
          addResult(report, {
            id: doc.id,
            collection: 'ondemand',
            identifier,
            field: 'source',
            status: 'ok',
          });
          if (verbose) console.log(`  ✅ [${legacyId}] ${identifier} — source=${expected}`);
        } else if (!currentSource) {
          // Source is missing
          if (fix) {
            try {
              await payload.update({
                collection: 'ondemand',
                id: doc.id,
                data: { source: expected },
              });
              addResult(report, {
                id: doc.id,
                collection: 'ondemand',
                identifier,
                field: 'source',
                status: 'fixed',
                currentValue: '(empty)',
                expectedValue: expected,
              });
              if (verbose) console.log(`  🔧 [${legacyId}] ${identifier} — set source=${expected}`);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              addResult(report, {
                id: doc.id,
                collection: 'ondemand',
                identifier,
                field: 'source',
                status: 'fix-failed',
                currentValue: '(empty)',
                expectedValue: expected,
                detail: msg,
              });
              if (verbose) console.log(`  💥 [${legacyId}] ${identifier} — fix failed: ${msg}`);
            }
          } else {
            addResult(report, {
              id: doc.id,
              collection: 'ondemand',
              identifier,
              field: 'source',
              status: 'missing',
              currentValue: '(empty)',
              expectedValue: expected,
            });
            if (verbose) {
              console.log(
                `  ❌ [${legacyId}] ${identifier} — source missing, expected=${expected}`,
              );
            }
          }
        } else if (fix) {
          // Source is set but doesn't match — fix it
          try {
            await payload.update({
              collection: 'ondemand',
              id: doc.id,
              data: { source: expected },
            });
            addResult(report, {
              id: doc.id,
              collection: 'ondemand',
              identifier,
              field: 'source',
              status: 'fixed',
              currentValue: currentSource,
              expectedValue: expected,
            });
            if (verbose) console.log(`  🔧 [${legacyId}] ${identifier} — ${currentSource} → ${expected}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            addResult(report, {
              id: doc.id,
              collection: 'ondemand',
              identifier,
              field: 'source',
              status: 'fix-failed',
              currentValue: currentSource,
              expectedValue: expected,
              detail: msg,
            });
            if (verbose) console.log(`  💥 [${legacyId}] ${identifier} — fix failed: ${msg}`);
          }
        } else {
          // Source is set but doesn't match — report only
          addResult(report, {
            id: doc.id,
            collection: 'ondemand',
            identifier,
            field: 'source',
            status: 'mismatch',
            currentValue: currentSource,
            expectedValue: expected,
          });
          if (verbose) {
            console.log(
              `  ⚠️  [${legacyId}] ${identifier} — source=${currentSource}, expected=${expected}`,
            );
          }
        }
      }

      processed += 1;
    }

    hasMore = batch.hasNextPage;
    page += 1;
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing — extends standard args with --from for MySQL source
// ---------------------------------------------------------------------------

function parseMysqlSource(argv: string[]): MySQLSource {
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from') {
      const value = args[i + 1];
      if (value === 'local-mysql' || value === 'prod-mysql') return value;
      throw new Error('--from must be "local-mysql" or "prod-mysql"');
    }
  }
  return 'prod-mysql';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const from = parseMysqlSource(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n📻 OnDemand Source Integrity Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit} records`);
  if (options.since) console.log(`   Since: ${options.since}`);
  if (options.verbose) console.log('   Verbose: on');
  console.log(`   MySQL source: ${from}`);

  const payload = await getPayload({ config });

  // Connect to MySQL
  const mysqlConfig = getMySQLConfig(from);
  const mysqlConn = await mysql.createConnection({
    host: mysqlConfig.host,
    database: mysqlConfig.database,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    port: mysqlConfig.port,
  });

  const report = emptyReport('ondemand-source', 'OnDemand Source');
  const startTime = Date.now();

  try {
    console.log('\n⏳ Checking OnDemand source fields...');
    await checkOnDemandSource(
      payload,
      mysqlConn,
      report,
      options.limit,
      options.fix,
      options.verbose,
      options.since,
    );
  } finally {
    await mysqlConn.end();
  }

  report.durationMs = Date.now() - startTime;

  printCheckReport(report);

  const integrityReport: IntegrityReport = {
    checks: [report],
    generatedAt: new Date().toISOString(),
    mode: options.fix ? 'fix' : 'check',
  };

  if (options.output) {
    writeReport(integrityReport, options.output);
  }

  console.log(`\nDone. Processed ${report.total} records in ${report.durationMs}ms.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
