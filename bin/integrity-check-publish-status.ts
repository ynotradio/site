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

// Skip Drizzle pushDevSchema — this script only reads/writes data, never alters schema
process.env.PAYLOAD_MIGRATING = 'true';

const PAGE_SIZE = 100;
type PublishStatusScope = 'all' | 'posts' | 'ondemand';

// ---------------------------------------------------------------------------
// MySQL helpers
// ---------------------------------------------------------------------------

/**
 * Bulk-fetch MySQL `deleted` values from a table by IDs.
 */
async function fetchDeletedByIds(
  mysqlConn: mysql.Connection,
  table: 'ondemand' | 'stories',
  ids: number[],
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();

  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, deleted FROM ${table} WHERE id IN (${placeholders})`,
    ids,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, row.deleted as string);
  }
  return map;
}

/**
 * Bulk-fetch MySQL `status` values from the custom_texts table.
 * Returns synthetic deleted flags: 'n' if active, 'y' otherwise.
 */
async function fetchCustomTextsDeleted(
  mysqlConn: mysql.Connection,
  mysqlIds: number[],
): Promise<Map<number, string>> {
  if (mysqlIds.length === 0) return new Map();

  const placeholders = mysqlIds.map(() => '?').join(',');
  const [rows] = await mysqlConn.query<mysql.RowDataPacket[]>(
    `SELECT id, status FROM custom_texts WHERE id IN (${placeholders})`,
    mysqlIds,
  );

  const map = new Map<number, string>();
  for (const row of rows) {
    map.set(row.id as number, (row.status as string) === 'active' ? 'n' : 'y');
  }
  return map;
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

    const mysqlDeleted = await fetchDeletedByIds(mysqlConn, 'ondemand', legacyIds);

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

    // Partition docs by MySQL table and collect IDs for bulk fetch
    const storyIds: number[] = [];
    const customTextIds: number[] = [];
    for (const doc of batch.docs) {
      const legacyId = doc.legacyId as number | undefined;
      if (legacyId == null) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const { table, mysqlId } = resolvePostLegacyId(legacyId);
      if (table === 'stories') {
        storyIds.push(mysqlId);
      } else {
        customTextIds.push(mysqlId);
      }
    }

    // Bulk-fetch MySQL deleted/status values
    const storiesDeleted = await fetchDeletedByIds(mysqlConn, 'stories', storyIds);
    const customTextsDeleted = await fetchCustomTextsDeleted(mysqlConn, customTextIds);

    for (const doc of batch.docs) {
      const legacyId = doc.legacyId as number | undefined;
      if (legacyId == null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentStatus = (doc as Record<string, unknown>)._status as string | undefined;
      const identifier = (doc.headline as string) || `Post #${doc.id}`;
      const { table, mysqlId } = resolvePostLegacyId(legacyId);

      // Look up the MySQL deleted/status value from bulk-fetched maps
      const deleted = table === 'stories'
        ? storiesDeleted.get(mysqlId)
        : customTextsDeleted.get(mysqlId);

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

function parseScope(argv: string[]): PublishStatusScope {
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--collection') {
      const value = args[i + 1];
      if (value === 'posts' || value === 'ondemand' || value === 'all') return value;
      throw new Error('--collection must be "posts", "ondemand", or "all"');
    }
  }
  return 'all';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const from = parseMysqlSource(process.argv);
  const scope = parseScope(process.argv);

  const mode = options.fix ? '🔧 FIX MODE' : '👀 DRY RUN';
  console.log(`\n📋 Publish Status Integrity Check — ${mode}`);
  if (options.limit) console.log(`   Limit: ${options.limit} records per collection`);
  if (options.since) console.log(`   Since: ${options.since}`);
  if (options.verbose) console.log('   Verbose: on');
  console.log(`   MySQL source: ${from}`);
  console.log(`   Collection scope: ${scope}`);

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

  const reportTitle = scope === 'posts'
    ? 'Publish Status (Stories + Custom Texts)'
    : scope === 'ondemand'
      ? 'Publish Status (OnDemand)'
      : 'Publish Status (OnDemand + Stories)';
  const report = emptyReport('publish-status', reportTitle);
  const startTime = Date.now();

  try {
    if (scope === 'all' || scope === 'ondemand') {
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
    }

    if (scope === 'all' || scope === 'posts') {
      console.log('\n⏳ Checking Posts (Stories + Custom Texts) publish status...');
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
    }
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
