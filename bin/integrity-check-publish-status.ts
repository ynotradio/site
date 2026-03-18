/* eslint-disable no-console, no-underscore-dangle */
/**
 * Publish Status Integrity Check
 *
 * For every OnDemand and Posts (Stories) record that was migrated from MySQL
 * (has a legacyId), verifies that records live in MySQL are set to
 * _status: 'published' in Payload. Optionally fixes draft records that
 * should be published.
 *
 * Usage:
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts                         # Dry run
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts --fix                   # Fix mode
 *   node --import ./bin/preload-nextenv-fix.mjs --import tsx \
 *     bin/integrity-check-publish-status.ts --limit 50 --verbose    # Limited verbose run
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
import { isMysqlRecordLive, resolvePostLegacyId } from './integrity-check-publish-status-utils';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// MySQL helpers
// ---------------------------------------------------------------------------

/**
 * Bulk-fetch MySQL `deleted` values for the ondemand table.
 */
async function fetchOnDemandDeleted(
  mysqlConn: mysql.Connection,
  legacyIds: number[],
): Promise<Map<number, string>> {
  if (legacyIds.length === 0) return new Map();

  const placeholders = legacyIds.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, deleted FROM ondemand WHERE id IN (${placeholders})`,
    legacyIds,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, row.deleted as string);
  }
  return map;
}

/**
 * Fetch `deleted` value from the stories table for a single ID.
 */
async function fetchStoryDeleted(
  mysqlConn: mysql.Connection,
  mysqlId: number,
): Promise<string | undefined> {
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    'SELECT deleted FROM stories WHERE id = ?',
    [mysqlId],
  );
  return rows.length > 0 ? (rows[0].deleted as string) : undefined;
}

/**
 * Fetch `status` value from the custom_texts table for a single ID.
 * Returns synthetic deleted flag: 'n' if active, 'y' otherwise.
 */
async function fetchCustomTextDeleted(
  mysqlConn: mysql.Connection,
  mysqlId: number,
): Promise<string | undefined> {
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    'SELECT status FROM custom_texts WHERE id = ?',
    [mysqlId],
  );
  if (rows.length === 0) return undefined;
  return (rows[0].status as string) === 'active' ? 'n' : 'y';
}

// ---------------------------------------------------------------------------
// Check logic — OnDemand
// ---------------------------------------------------------------------------

async function checkOnDemandStatus(
  payload: Payload,
  mysqlConn: mysql.Connection,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<number> {
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
      draft: true, // include draft records
    });

    if (batch.docs.length === 0) break;

    // Bulk-fetch MySQL deleted values
    const legacyIds = batch.docs
      .map((d) => d.legacyId as number | undefined)
      .filter((id): id is number => id != null);

    const mysqlDeleted = await fetchOnDemandDeleted(mysqlConn, legacyIds);

    for (const doc of batch.docs) {
      const legacyId = doc.legacyId as number | undefined;
      if (legacyId == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentStatus = (doc as Record<string, unknown>)._status as string | undefined;
      const deleted = mysqlDeleted.get(legacyId);
      const identifier = (doc.headline as string) || `OnDemand #${doc.id}`;

      if (deleted === undefined) {
        addResult(report, {
          id: doc.id,
          collection: 'ondemand',
          identifier,
          field: '_status',
          status: 'skipped',
          detail: `No MySQL record found for legacyId=${legacyId}`,
        });
        if (verbose) console.log(`  ⏭️  [ondemand ${legacyId}] ${identifier} — MySQL record not found`);
      } else {
        const shouldPublish = isMysqlRecordLive(deleted);
        const expectedStatus = shouldPublish ? 'published' : 'draft';

        if (currentStatus === expectedStatus) {
          addResult(report, {
            id: doc.id,
            collection: 'ondemand',
            identifier,
            field: '_status',
            status: 'ok',
          });
          if (verbose) console.log(`  ✅ [ondemand ${legacyId}] ${identifier} — _status=${currentStatus}`);
        } else if (shouldPublish && currentStatus !== 'published') {
          // Record is live in MySQL but not published in Payload
          if (fix) {
            try {
              await payload.update({
                collection: 'ondemand',
                id: doc.id,
                data: { _status: 'published' },
              });
              addResult(report, {
                id: doc.id,
                collection: 'ondemand',
                identifier,
                field: '_status',
                status: 'fixed',
                currentValue: currentStatus || '(unknown)',
                expectedValue: 'published',
              });
              if (verbose) {
                console.log(
                  `  🔧 [ondemand ${legacyId}] ${identifier} — ${currentStatus} → published`,
                );
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              addResult(report, {
                id: doc.id,
                collection: 'ondemand',
                identifier,
                field: '_status',
                status: 'fix-failed',
                currentValue: currentStatus || '(unknown)',
                expectedValue: 'published',
                detail: msg,
              });
              if (verbose) console.log(`  💥 [ondemand ${legacyId}] ${identifier} — fix failed: ${msg}`);
            }
          } else {
            addResult(report, {
              id: doc.id,
              collection: 'ondemand',
              identifier,
              field: '_status',
              status: 'mismatch',
              currentValue: currentStatus || '(unknown)',
              expectedValue: 'published',
            });
            if (verbose) {
              console.log(
                `  ⚠️  [ondemand ${legacyId}] ${identifier} — _status=${currentStatus}, should be published`,
              );
            }
          }
        } else {
          // Record is deleted in MySQL; leave as-is (we only promote to published)
          addResult(report, {
            id: doc.id,
            collection: 'ondemand',
            identifier,
            field: '_status',
            status: 'ok',
            detail: 'Deleted in MySQL, draft status acceptable',
          });
          if (verbose) {
            console.log(
              `  ✅ [ondemand ${legacyId}] ${identifier} — deleted in MySQL, draft is OK`,
            );
          }
        }
      }

      processed += 1;
    }

    hasMore = batch.hasNextPage;
    page += 1;
  }

  return processed;
}

// ---------------------------------------------------------------------------
// Check logic — Posts (Stories + Custom Texts)
// ---------------------------------------------------------------------------

async function checkPostsStatus(
  payload: Payload,
  mysqlConn: mysql.Connection,
  report: CheckReport,
  limit: number,
  fix: boolean,
  verbose: boolean,
  since: string,
): Promise<number> {
  let page = 1;
  let processed = 0;
  let hasMore = true;

  while (hasMore) {
    const pageLimit = limit ? Math.min(PAGE_SIZE, limit - processed) : PAGE_SIZE;
    if (pageLimit <= 0) break;

    const batch = await payload.find({
      collection: 'posts',
      where: withSinceFilter({ legacyId: { exists: true } }, since),
      limit: pageLimit,
      page,
      sort: 'id',
      depth: 0,
      draft: true, // include draft records
    });

    if (batch.docs.length === 0) break;

    for (const doc of batch.docs) {
      const legacyId = doc.legacyId as number | undefined;
      if (legacyId == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentStatus = (doc as Record<string, unknown>)._status as string | undefined;
      const identifier = (doc.headline as string) || `Post #${doc.id}`;
      const { table, mysqlId } = resolvePostLegacyId(legacyId);

      // Fetch the MySQL deleted/status value
      let deleted: string | undefined;
      if (table === 'stories') {
        deleted = await fetchStoryDeleted(mysqlConn, mysqlId);
      } else {
        deleted = await fetchCustomTextDeleted(mysqlConn, mysqlId);
      }

      if (deleted === undefined) {
        addResult(report, {
          id: doc.id,
          collection: 'posts',
          identifier,
          field: '_status',
          status: 'skipped',
          detail: `No MySQL record found in ${table} for id=${mysqlId} (legacyId=${legacyId})`,
        });
        if (verbose) {
          console.log(
            `  ⏭️  [posts ${legacyId}] ${identifier} — MySQL record not found in ${table}`,
          );
        }
      } else {
        const shouldPublish = isMysqlRecordLive(deleted);
        const expectedStatus = shouldPublish ? 'published' : 'draft';

        if (currentStatus === expectedStatus) {
          addResult(report, {
            id: doc.id,
            collection: 'posts',
            identifier,
            field: '_status',
            status: 'ok',
          });
          if (verbose) console.log(`  ✅ [posts ${legacyId}] ${identifier} — _status=${currentStatus}`);
        } else if (shouldPublish && currentStatus !== 'published') {
          if (fix) {
            try {
              await payload.update({
                collection: 'posts',
                id: doc.id,
                data: { _status: 'published' },
              });
              addResult(report, {
                id: doc.id,
                collection: 'posts',
                identifier,
                field: '_status',
                status: 'fixed',
                currentValue: currentStatus || '(unknown)',
                expectedValue: 'published',
              });
              if (verbose) {
                console.log(
                  `  🔧 [posts ${legacyId}] ${identifier} — ${currentStatus} → published`,
                );
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              addResult(report, {
                id: doc.id,
                collection: 'posts',
                identifier,
                field: '_status',
                status: 'fix-failed',
                currentValue: currentStatus || '(unknown)',
                expectedValue: 'published',
                detail: msg,
              });
              if (verbose) console.log(`  💥 [posts ${legacyId}] ${identifier} — fix failed: ${msg}`);
            }
          } else {
            addResult(report, {
              id: doc.id,
              collection: 'posts',
              identifier,
              field: '_status',
              status: 'mismatch',
              currentValue: currentStatus || '(unknown)',
              expectedValue: 'published',
            });
            if (verbose) {
              console.log(
                `  ⚠️  [posts ${legacyId}] ${identifier} — _status=${currentStatus}, should be published`,
              );
            }
          }
        } else {
          addResult(report, {
            id: doc.id,
            collection: 'posts',
            identifier,
            field: '_status',
            status: 'ok',
            detail: 'Deleted in MySQL, draft status acceptable',
          });
          if (verbose) console.log(`  ✅ [posts ${legacyId}] ${identifier} — deleted in MySQL, draft is OK`);
        }
      }

      processed += 1;
    }

    hasMore = batch.hasNextPage;
    page += 1;
  }

  return processed;
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
  console.log(`\n📋 Publish Status Integrity Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit} records per collection`);
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

  const report = emptyReport('publish-status', 'Publish Status (OnDemand + Stories)');
  const startTime = Date.now();

  try {
    console.log('\n⏳ Checking OnDemand publish status...');
    const odCount = await checkOnDemandStatus(
      payload,
      mysqlConn,
      report,
      options.limit,
      options.fix,
      options.verbose,
      options.since,
    );
    console.log(`   Checked ${odCount} OnDemand records`);

    console.log('\n⏳ Checking Posts (Stories) publish status...');
    const postsCount = await checkPostsStatus(
      payload,
      mysqlConn,
      report,
      options.limit,
      options.fix,
      options.verbose,
      options.since,
    );
    console.log(`   Checked ${postsCount} Posts records`);
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
